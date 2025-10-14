import db from '../database/connection.js';
import {
  DashboardStats,
  ActivityItem,
  MapData,
  DriverPerformance,
  NotFoundError,
  ForbiddenError,
  ServiceError
} from '../types/services.js';

export class DashboardService {
  /**
   * Get comprehensive dashboard statistics for a business
   */
  static async getStats(businessId: string, period: string = '30'): Promise<DashboardStats> {
    try {
      // Get order metrics
      const orderMetrics = db.prepare(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status IN ('pending', 'assigned', 'picked_up', 'in_transit') THEN 1 END) as active_orders,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
          COUNT(CASE WHEN status = 'picked_up' THEN 1 END) as picked_up,
          COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM orders 
        WHERE business_id = ? AND created_at >= datetime('now', '-' || ? || ' days')
      `).get(businessId, period) as any;

      // Get driver metrics
      const driverMetrics = db.prepare(`
        SELECT 
          COUNT(*) as total_drivers,
          COUNT(CASE WHEN is_available = 1 THEN 1 END) as active_drivers
        FROM drivers 
        WHERE business_id = ?
      `).get(businessId) as any;

      // Get revenue (assuming there's a price field or calculate based on delivery fee)
      const revenueData = db.prepare(`
        SELECT 
          COALESCE(SUM(delivery_fee), 0) as total_revenue
        FROM orders 
        WHERE business_id = ? AND status = 'delivered' 
        AND created_at >= datetime('now', '-' || ? || ' days')
      `).get(businessId, period) as any;

      // Get average delivery time
      const deliveryTimeData = db.prepare(`
        SELECT 
          AVG(
            CASE 
              WHEN actual_delivery IS NOT NULL AND actual_pickup IS NOT NULL 
              THEN (julianday(actual_delivery) - julianday(actual_pickup)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_delivery_time
        FROM orders 
        WHERE business_id = ? AND status = 'delivered'
        AND created_at >= datetime('now', '-' || ? || ' days')
      `).get(businessId, period) as any;

      // Get delivery performance metrics
      const deliveryMetrics = db.prepare(`
        SELECT 
          COUNT(CASE 
            WHEN actual_delivery IS NOT NULL AND estimated_delivery IS NOT NULL 
            AND actual_delivery <= estimated_delivery 
            THEN 1 
          END) as on_time,
          COUNT(CASE 
            WHEN actual_delivery IS NOT NULL AND estimated_delivery IS NOT NULL 
            AND actual_delivery > estimated_delivery 
            THEN 1 
          END) as delayed,
          AVG(
            CASE 
              WHEN actual_delivery IS NOT NULL AND estimated_delivery IS NOT NULL 
              AND actual_delivery > estimated_delivery
              THEN (julianday(actual_delivery) - julianday(estimated_delivery)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_delay_minutes
        FROM orders 
        WHERE business_id = ? AND status = 'delivered'
        AND created_at >= datetime('now', '-' || ? || ' days')
      `).get(businessId, period) as any;

      // Get top drivers
      const topDrivers = db.prepare(`
        SELECT 
          d.id,
          u.name,
          COUNT(o.id) as completed_orders
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered'
          AND o.created_at >= datetime('now', '-' || ? || ' days')
        WHERE d.business_id = ?
        GROUP BY d.id, u.name
        ORDER BY completed_orders DESC
        LIMIT 5
      `).all(period, businessId) as any[];

      return {
        totalOrders: orderMetrics.total_orders || 0,
        activeOrders: orderMetrics.active_orders || 0,
        completedOrders: orderMetrics.completed_orders || 0,
        cancelledOrders: orderMetrics.cancelled_orders || 0,
        totalDrivers: driverMetrics.total_drivers || 0,
        activeDrivers: driverMetrics.active_drivers || 0,
        totalRevenue: revenueData.total_revenue || 0,
        avgDeliveryTime: deliveryTimeData.avg_delivery_time || 0,
        orderMetrics: {
          pending: orderMetrics.pending || 0,
          assigned: orderMetrics.assigned || 0,
          picked_up: orderMetrics.picked_up || 0,
          in_transit: orderMetrics.in_transit || 0,
          delivered: orderMetrics.delivered || 0,
          cancelled: orderMetrics.cancelled || 0,
        },
        deliveryMetrics: {
          onTime: deliveryMetrics.on_time || 0,
          delayed: deliveryMetrics.delayed || 0,
          avgDelayMinutes: deliveryMetrics.avg_delay_minutes || 0,
        },
        topDrivers: topDrivers.map(driver => ({
          id: driver.id,
          name: driver.name,
          completedOrders: driver.completed_orders,
        })),
      };
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw new ServiceError('Failed to fetch dashboard statistics');
    }
  }

  /**
   * Get real-time activity feed for a business
   */
  static async getActivity(businessId: string, limit: number = 20): Promise<ActivityItem[]> {
    try {
      // Get recent order updates
      const orderActivity = db.prepare(`
        SELECT 
          'order' as type,
          o.id,
          o.tracking_code,
          o.status,
          o.customer_name,
          o.updated_at as timestamp,
          u.name as driver_name
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.business_id = ?
        ORDER BY o.updated_at DESC
        LIMIT ?
      `).all(businessId, Math.floor(limit / 2)) as ActivityItem[];

      // Get recent geofence events
      const geofenceActivity = db.prepare(`
        SELECT 
          'geofence' as type,
          ge.id,
          ge.event_type,
          ge.timestamp,
          g.name as geofence_name,
          g.type as geofence_type,
          u.name as driver_name,
          o.tracking_code
        FROM geofence_events ge
        JOIN geofences g ON ge.geofence_id = g.id
        JOIN drivers d ON ge.driver_id = d.id
        JOIN users u ON d.user_id = u.id
        LEFT JOIN orders o ON ge.order_id = o.id
        WHERE g.business_id = ?
        ORDER BY ge.timestamp DESC
        LIMIT ?
      `).all(businessId, Math.floor(limit / 2)) as ActivityItem[];

      // Combine and sort activities
      const allActivity = [...orderActivity, ...geofenceActivity]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return allActivity;
    } catch (error) {
      console.error('Dashboard activity error:', error);
      throw new ServiceError('Failed to fetch dashboard activity');
    }
  }

  /**
   * Get map data including active orders, drivers, and geofences
   */
  static async getMapData(businessId: string): Promise<MapData> {
    try {
      // Get active orders with locations
      const activeOrders = db.prepare(`
        SELECT 
          o.id, o.tracking_code, o.status, o.priority, o.customer_name,
          o.pickup_latitude, o.pickup_longitude, o.pickup_address,
          o.delivery_latitude, o.delivery_longitude, o.delivery_address,
          o.estimated_delivery,
          d.id as driver_id, d.current_latitude as driver_latitude, 
          d.current_longitude as driver_longitude, d.last_location_update,
          u.name as driver_name
        FROM orders o
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE o.business_id = ? AND o.status IN ('pending', 'assigned', 'picked_up', 'in_transit')
        ORDER BY o.created_at DESC
      `).all(businessId) as any[];

      // Get all drivers with current locations
      const drivers = db.prepare(`
        SELECT 
          d.id, d.current_latitude, d.current_longitude, d.last_location_update,
          d.is_available, d.vehicle_type, d.license_plate,
          u.name, u.phone
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        WHERE d.business_id = ?
        ORDER BY d.last_location_update DESC
      `).all(businessId) as any[];

      // Get active geofences
      const geofences = db.prepare(`
        SELECT id, name, type, center_latitude, center_longitude, radius
        FROM geofences 
        WHERE business_id = ? AND is_active = 1
      `).all(businessId) as any[];

      return {
        activeOrders,
        drivers,
        geofences,
      };
    } catch (error) {
      console.error('Dashboard map data error:', error);
      throw new ServiceError('Failed to fetch map data');
    }
  }

  /**
   * Get driver performance metrics
   */
  static async getDriverPerformance(businessId: string, period: string = '30'): Promise<DriverPerformance[]> {
    try {
      const driverPerformance = db.prepare(`
        SELECT 
          d.id,
          u.name,
          u.phone,
          d.vehicle_type,
          d.is_available,
          COUNT(o.id) as total_orders,
          COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as completed_orders,
          COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
          AVG(
            CASE 
              WHEN o.actual_delivery IS NOT NULL AND o.estimated_delivery IS NOT NULL 
              THEN (julianday(o.actual_delivery) - julianday(o.estimated_delivery)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_delay_minutes,
          AVG(
            CASE 
              WHEN o.actual_delivery IS NOT NULL AND o.actual_pickup IS NOT NULL 
              THEN (julianday(o.actual_delivery) - julianday(o.actual_pickup)) * 24 * 60
              ELSE NULL 
            END
          ) as avg_delivery_time_minutes
        FROM drivers d
        JOIN users u ON d.user_id = u.id
        LEFT JOIN orders o ON d.id = o.driver_id 
          AND o.created_at >= datetime('now', '-' || ? || ' days')
        WHERE d.business_id = ?
        GROUP BY d.id, u.name, u.phone, d.vehicle_type, d.is_available
        ORDER BY completed_orders DESC, avg_delay_minutes ASC
      `).all(period, businessId) as DriverPerformance[];

      return driverPerformance;
    } catch (error) {
      console.error('Driver performance error:', error);
      throw new ServiceError('Failed to fetch driver performance');
    }
  }

  /**
   * Validate user permissions for dashboard access
   */
  static validateDashboardAccess(userRole: string): void {
    if (userRole !== 'business_owner' && userRole !== 'admin') {
      throw new ForbiddenError('Insufficient permissions');
    }
  }
}