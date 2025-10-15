import { generateId, generateTrackingCode } from '@zoneflow/shared';
import db from '../database/connection.js';
import {
  OrderFilters,
  Pagination,
  PaginationResult,
  CreateOrderData,
  UpdateOrderStatusData,
  OrderWithDriver,
  LocationHistory,
  NotFoundError,
  ValidationError,
  ServiceError
} from '../types/services.js';

export class OrderService {
  private static canTransition(from: string, to: string): boolean {
    const allowed: Record<string, string[]> = {
      pending: ['assigned', 'cancelled'],
      assigned: ['picked_up', 'cancelled'],
      picked_up: ['in_transit', 'cancelled'],
      in_transit: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    return (allowed[from] || []).includes(to);
  }
  /**
   * Get orders for a business with filtering and pagination
   */
  static async getOrders(
    businessId: string,
    filters: OrderFilters = {},
    pagination: Pagination
  ): Promise<PaginationResult<OrderWithDriver>> {
    try {
      let query = `
        SELECT o.*, d.user_id as driver_user_id, u.name as driver_name
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.business_id = ?
      `;
      const params: any[] = [businessId];

      // Apply filters
      if (filters.status) {
        query += ' AND o.status = ?';
        params.push(filters.status);
      }

      if (filters.priority) {
        query += ' AND o.priority = ?';
        params.push(filters.priority);
      }

      if (filters.driverId) {
        query += ' AND o.driver_id = ?';
        params.push(filters.driverId);
      }

      query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
      params.push(pagination.limit, pagination.offset);

      const orders = db.prepare(query).all(...params) as OrderWithDriver[];

      // Get total count for pagination
      let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE business_id = ?';
      const countParams: any[] = [businessId];

      if (filters.status) {
        countQuery += ' AND status = ?';
        countParams.push(filters.status);
      }

      if (filters.priority) {
        countQuery += ' AND priority = ?';
        countParams.push(filters.priority);
      }

      if (filters.driverId) {
        countQuery += ' AND driver_id = ?';
        countParams.push(filters.driverId);
      }

      const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

      return {
        data: orders,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } catch (error) {
      console.error('Get orders error:', error);
      throw new ServiceError('Failed to fetch orders');
    }
  }

  /**
   * Get a single order by ID
   */
  static async getOrderById(orderId: string, businessId: string): Promise<{
    order: OrderWithDriver;
    locationHistory: LocationHistory[];
  }> {
    try {
      const order = db.prepare(`
        SELECT o.*, d.user_id as driver_user_id, u.name as driver_name, u.phone as driver_phone
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.id = ? AND o.business_id = ?
      `).get(orderId, businessId) as OrderWithDriver | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Get location history for this order
      const locationHistory = db.prepare(`
        SELECT latitude, longitude, timestamp, accuracy, speed, heading
        FROM location_history
        WHERE order_id = ?
        ORDER BY timestamp DESC
        LIMIT 50
      `).all(orderId) as LocationHistory[];

      return {
        order,
        locationHistory,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Get order error:', error);
      throw new ServiceError('Failed to fetch order');
    }
  }

  /**
   * Create a new order
   */
  static async createOrder(orderData: CreateOrderData, businessId: string): Promise<OrderWithDriver> {
    try {
      const orderId = generateId();
      const trackingCode = generateTrackingCode();

      db.prepare(`
        INSERT INTO orders (
          id, tracking_code, business_id, customer_name, customer_phone, customer_email,
          pickup_address, pickup_latitude, pickup_longitude,
          delivery_address, delivery_latitude, delivery_longitude,
          status, priority, estimated_delivery, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId, trackingCode, businessId, orderData.customerName,
        orderData.customerPhone || null, orderData.customerEmail || null,
        orderData.pickupAddress, orderData.pickupLatitude, orderData.pickupLongitude,
        orderData.deliveryAddress, orderData.deliveryLatitude, orderData.deliveryLongitude,
        'pending', orderData.priority, orderData.estimatedDelivery || null, orderData.notes || null
      );

      const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderWithDriver;

      return newOrder;
    } catch (error) {
      console.error('Create order error:', error);
      if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
        throw new ValidationError('Order with this tracking code already exists');
      }
      throw new ServiceError('Failed to create order');
    }
  }

  /**
   * Update order status
   */
  static async updateOrderStatus(
    orderId: string,
    statusData: UpdateOrderStatusData,
    businessId: string
  ): Promise<OrderWithDriver> {
    try {
      // Check if order exists and belongs to user's business
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
        .get(orderId, businessId) as OrderWithDriver | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Validate transition
      if (!this.canTransition(order.status, statusData.status)) {
        throw new ValidationError(`Invalid transition from ${order.status} to ${statusData.status}`);
      }

      // Prepare update data
      const updateData: any = {
        status: statusData.status,
        updated_at: new Date().toISOString(),
      };

      if (statusData.notes) {
        updateData.notes = statusData.notes;
      }

      // Set timestamps based on status
      if (statusData.status === 'picked_up' && !order.actual_pickup) {
        updateData.actual_pickup = new Date().toISOString();
      } else if (statusData.status === 'delivered' && !order.actual_delivery) {
        updateData.actual_delivery = new Date().toISOString();
      }

      // Build dynamic update query
      const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(updateData);

      db.prepare(`UPDATE orders SET ${updateFields} WHERE id = ?`)
        .run(...updateValues, orderId);

      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderWithDriver;

      return updatedOrder;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Update order status error:', error);
      throw new ServiceError('Failed to update order status');
    }
  }

  /**
   * Assign a driver to an order
   */
  static async assignDriver(orderId: string, driverId: string, businessId: string): Promise<OrderWithDriver> {
    try {
      // Check if order exists and belongs to user's business
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
        .get(orderId, businessId) as OrderWithDriver | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      // Check if driver exists and belongs to the same business
      const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND business_id = ?')
        .get(driverId, businessId);

      if (!driver) {
        throw new NotFoundError('Driver');
      }

      // Update order with driver assignment
      db.prepare(`
        UPDATE orders 
        SET driver_id = ?, status = 'assigned', updated_at = ?
        WHERE id = ?
      `).run(driverId, new Date().toISOString(), orderId);

      const updatedOrder = db.prepare(`
        SELECT o.*, d.user_id as driver_user_id, u.name as driver_name, u.phone as driver_phone
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.id = ?
      `).get(orderId) as OrderWithDriver;

      return updatedOrder;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Assign driver error:', error);
      throw new ServiceError('Failed to assign driver to order');
    }
  }

  /**
   * Get order by tracking code (public method for customers)
   */
  static async getOrderByTrackingCode(trackingCode: string): Promise<OrderWithDriver> {
    try {
      const order = db.prepare(`
        SELECT o.*, d.user_id as driver_user_id, u.name as driver_name, u.phone as driver_phone
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.tracking_code = ?
      `).get(trackingCode) as OrderWithDriver | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      return order;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error('Get order by tracking code error:', error);
      throw new ServiceError('Failed to fetch order');
    }
  }

  /**
   * Cancel an order
   */
  static async cancelOrder(orderId: string, businessId: string, reason?: string): Promise<OrderWithDriver> {
    try {
      const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
        .get(orderId, businessId) as OrderWithDriver | undefined;

      if (!order) {
        throw new NotFoundError('Order');
      }

      if (order.status === 'delivered') {
        throw new ValidationError('Cannot cancel a delivered order');
      }

      const updateData: any = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.notes = reason;
      }

      const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateValues = Object.values(updateData);

      db.prepare(`UPDATE orders SET ${updateFields} WHERE id = ?`)
        .run(...updateValues, orderId);

      const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as OrderWithDriver;

      return updatedOrder;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      console.error('Cancel order error:', error);
      throw new ServiceError('Failed to cancel order');
    }
  }
}