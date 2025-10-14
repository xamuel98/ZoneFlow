import { generateId } from '@zoneflow/shared';
import db from '../database/connection.js';
import {
  LocationData,
  LocationHistory,
  NotFoundError,
  ValidationError,
  ServiceError
} from '../types/services.js';

export class LocationService {
  /**
   * Update driver location and record history
   */
  static async updateDriverLocation(
    userId: string,
    locationData: LocationData & { orderId?: string }
  ): Promise<{
    location: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    driver: {
      id: string;
      user_id: string;
      business_id: string;
    };
  }> {
    try {
      // Get driver info for the current user
      const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId) as {
        id: string;
        user_id: string;
        business_id: string;
        [key: string]: any;
      } | undefined;

      if (!driver) {
        throw new NotFoundError('Driver profile');
      }

      // Update driver's current location
      db.prepare(`
        UPDATE drivers 
        SET current_latitude = ?, current_longitude = ?, last_location_update = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(locationData.latitude, locationData.longitude, driver.id);

      // Record location history
      const historyId = generateId();
      db.prepare(`
        INSERT INTO location_history (
          id, driver_id, order_id, latitude, longitude, accuracy, speed, heading, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        historyId, driver.id, locationData.orderId || null, 
        locationData.latitude, locationData.longitude,
        locationData.accuracy || null, locationData.speed || null, 
        locationData.heading || null, new Date().toISOString()
      );

      return {
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: new Date().toISOString(),
        },
        driver: {
          id: driver.id,
          user_id: driver.user_id,
          business_id: driver.business_id,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating driver location:', error);
      throw new ServiceError('Failed to update location');
    }
  }

  /**
   * Get location history for a driver or order
   */
  static async getLocationHistory(
    userId: string,
    options: {
      orderId?: string;
      limit?: number;
      page?: number;
    } = {}
  ): Promise<{
    history: LocationHistory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const { orderId, limit = 50, page = 1 } = options;
      const offset = (page - 1) * limit;

      // Get driver info for the current user
      const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(userId) as {
        id: string;
        [key: string]: any;
      } | undefined;

      if (!driver) {
        throw new NotFoundError('Driver profile');
      }

      let query = `
        SELECT latitude, longitude, timestamp, accuracy, speed, heading
        FROM location_history
        WHERE driver_id = ?
      `;
      const params: any[] = [driver.id];

      if (orderId) {
        query += ' AND order_id = ?';
        params.push(orderId);
      }

      query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const history = db.prepare(query).all(...params) as LocationHistory[];

      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM location_history WHERE driver_id = ?';
      const countParams: any[] = [driver.id];

      if (orderId) {
        countQuery += ' AND order_id = ?';
        countParams.push(orderId);
      }

      const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

      return {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching location history:', error);
      throw new ServiceError('Failed to fetch location history');
    }
  }

  /**
   * Get all drivers with their current locations for a business
   */
  static async getDriversWithLocations(businessId: string): Promise<Array<{
    id: string;
    name: string;
    phone: string;
    current_latitude?: number;
    current_longitude?: number;
    last_location_update?: string;
    is_available: boolean;
    vehicle_type: string;
    license_plate: string;
  }>> {
    try {
      const drivers = db.prepare(`
        SELECT 
          d.id, d.current_latitude, d.current_longitude, d.last_location_update,
          d.is_available, d.vehicle_type, d.license_plate,
          u.name, u.phone
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.business_id = ?
        ORDER BY d.last_location_update DESC
      `).all(businessId) as Array<{
        id: string;
        name: string;
        phone: string;
        current_latitude?: number;
        current_longitude?: number;
        last_location_update?: string;
        is_available: boolean;
        vehicle_type: string;
        license_plate: string;
      }>;

      return drivers;
    } catch (error) {
      console.error('Error fetching drivers with locations:', error);
      throw new ServiceError('Failed to fetch drivers with locations');
    }
  }

  /**
   * Get location history for a specific order
   */
  static async getOrderLocationHistory(
    orderId: string,
    businessId: string,
    limit: number = 50
  ): Promise<{
    order: {
      id: string;
      tracking_code: string;
      status: string;
      driver_name?: string;
    };
    locationHistory: LocationHistory[];
  }> {
    try {
      // Verify order exists and belongs to business
      const order = db.prepare(`
        SELECT o.id, o.tracking_code, o.status, u.name as driver_name
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.id = ? AND o.business_id = ?
      `).get(orderId, businessId) as {
        id: string;
        tracking_code: string;
        status: string;
        driver_name?: string;
      } | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Get location history for this order
      const locationHistory = db.prepare(`
        SELECT latitude, longitude, timestamp, accuracy, speed, heading
        FROM location_history
        WHERE order_id = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(orderId, limit) as LocationHistory[];

      return {
        order,
        locationHistory,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching order location history:', error);
      throw new ServiceError('Failed to fetch order location history');
    }
  }

  /**
   * Update driver availability status
   */
  static async updateDriverAvailability(
    userId: string,
    isAvailable: boolean
  ): Promise<{
    id: string;
    is_available: boolean;
    name: string;
  }> {
    try {
      // Get driver info for the current user
      const driver = db.prepare(`
        SELECT d.*, u.name
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.user_id = ?
      `).get(userId) as {
        id: string;
        name: string;
        [key: string]: any;
      } | undefined;

      if (!driver) {
        throw new NotFoundError('Driver profile');
      }

      // Update availability status
      db.prepare(`
        UPDATE drivers 
        SET is_available = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).run(isAvailable ? 1 : 0, userId);

      return {
        id: driver.id,
        is_available: isAvailable,
        name: driver.name,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error updating driver availability:', error);
      throw new ServiceError('Failed to update driver availability');
    }
  }

  /**
   * Get tracking information for an order (public method)
   */
  static async getOrderTracking(trackingCode: string): Promise<{
    order: {
      id: string;
      tracking_code: string;
      status: string;
      customer_name: string;
      pickup_address: string;
      delivery_address: string;
      estimated_delivery?: string;
      actual_pickup?: string;
      actual_delivery?: string;
    };
    currentLocation?: {
      latitude: number;
      longitude: number;
      timestamp: string;
    };
    locationHistory: LocationHistory[];
  }> {
    try {
      // Get order information
      const order = db.prepare(`
        SELECT 
          id, tracking_code, status, customer_name, pickup_address, delivery_address,
          estimated_delivery, actual_pickup, actual_delivery
        FROM orders 
        WHERE tracking_code = ?
      `).get(trackingCode) as {
        id: string;
        tracking_code: string;
        status: string;
        customer_name: string;
        pickup_address: string;
        delivery_address: string;
        estimated_delivery?: string;
        actual_pickup?: string;
        actual_delivery?: string;
      } | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Get recent location updates (last 10)
      const locationHistory = db.prepare(`
        SELECT latitude, longitude, timestamp
        FROM location_history
        WHERE order_id = ?
        ORDER BY timestamp DESC
        LIMIT 10
      `).all(order.id) as LocationHistory[];

      // Get current location (most recent)
      const currentLocation = locationHistory.length > 0 ? {
        latitude: locationHistory[0].latitude,
        longitude: locationHistory[0].longitude,
        timestamp: locationHistory[0].timestamp,
      } : undefined;

      return {
        order,
        currentLocation,
        locationHistory,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Error fetching order tracking:', error);
      throw new ServiceError('Failed to fetch order tracking');
    }
  }
}