import { Hono } from 'hono';
import db from '../database/connection.js';
import { authMiddleware } from '../middleware/auth.js';

const dashboard = new Hono();

// Apply auth middleware to all routes
dashboard.use('*', authMiddleware);

// Get dashboard statistics
dashboard.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Get basic counts
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders WHERE business_id = ?')
      .get(user.businessId) as { count: number };

    const activeOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE business_id = ? AND status IN ('pending', 'assigned', 'picked_up', 'in_transit')
    `).get(user.businessId) as { count: number };

    const totalDrivers = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE business_id = ?')
      .get(user.businessId) as { count: number };

    const availableDrivers = db.prepare(`
      SELECT COUNT(*) as count FROM drivers 
      WHERE business_id = ? AND is_available = 1
    `).get(user.businessId) as { count: number };

    const totalGeofences = db.prepare('SELECT COUNT(*) as count FROM geofences WHERE business_id = ?')
      .get(user.businessId) as { count: number };

    // Get orders by status
    const ordersByStatus = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM orders 
      WHERE business_id = ?
      GROUP BY status
    `).all(user.businessId);

    // Get orders by priority
    const ordersByPriority = db.prepare(`
      SELECT priority, COUNT(*) as count
      FROM orders 
      WHERE business_id = ?
      GROUP BY priority
    `).all(user.businessId);

    // Get recent orders (last 7 days)
    const recentOrders = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM orders 
      WHERE business_id = ? AND created_at >= datetime('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).all(user.businessId);

    // Get delivery performance (last 30 days)
    const deliveryMetrics = db.prepare(`
      SELECT 
        COUNT(*) as total_deliveries,
        AVG(
          CASE 
            WHEN actual_delivery IS NOT NULL AND estimated_delivery IS NOT NULL 
            THEN (julianday(actual_delivery) - julianday(estimated_delivery)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_delay_minutes,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_deliveries,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_deliveries
      FROM orders 
      WHERE business_id = ? AND created_at >= datetime('now', '-30 days')
    `).get(user.businessId);

    // Get top performing drivers (last 30 days)
    const topDrivers = db.prepare(`
      SELECT 
        u.name,
        COUNT(o.id) as completed_orders,
        AVG(
          CASE 
            WHEN o.actual_delivery IS NOT NULL AND o.estimated_delivery IS NOT NULL 
            THEN (julianday(o.actual_delivery) - julianday(o.estimated_delivery)) * 24 * 60
            ELSE NULL 
          END
        ) as avg_delay_minutes
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN orders o ON d.id = o.driver_id AND o.status = 'delivered' 
        AND o.created_at >= datetime('now', '-30 days')
      WHERE d.business_id = ?
      GROUP BY d.id, u.name
      HAVING completed_orders > 0
      ORDER BY completed_orders DESC, avg_delay_minutes ASC
      LIMIT 5
    `).all(user.businessId);

    return c.json({
      success: true,
      data: {
        overview: {
          totalOrders: totalOrders.count,
          activeOrders: activeOrders.count,
          totalDrivers: totalDrivers.count,
          availableDrivers: availableDrivers.count,
          totalGeofences: totalGeofences.count,
        },
        ordersByStatus,
        ordersByPriority,
        recentOrders,
        deliveryMetrics,
        topDrivers,
      },
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch dashboard statistics' }, 500);
  }
});

// Get real-time activity feed
dashboard.get('/activity', async (c) => {
  try {
    const user = c.get('user');
    const limit = parseInt(c.req.query('limit') || '20');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

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
    `).all(user.businessId, Math.floor(limit / 2));

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
    `).all(user.businessId, Math.floor(limit / 2));

    // Combine and sort activities
    const allActivity = [...orderActivity, ...geofenceActivity]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return c.json({
      success: true,
      data: { activity: allActivity },
    });

  } catch (error) {
    console.error('Get dashboard activity error:', error);
    return c.json({ error: 'Failed to fetch dashboard activity' }, 500);
  }
});

// Get map data for dashboard
dashboard.get('/map', async (c) => {
  try {
    const user = c.get('user');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

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
    `).all(user.businessId);

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
    `).all(user.businessId);

    // Get active geofences
    const geofences = db.prepare(`
      SELECT id, name, type, center_latitude, center_longitude, radius
      FROM geofences 
      WHERE business_id = ? AND is_active = 1
    `).all(user.businessId);

    return c.json({
      success: true,
      data: {
        activeOrders,
        drivers,
        geofences,
      },
    });

  } catch (error) {
    console.error('Get dashboard map data error:', error);
    return c.json({ error: 'Failed to fetch map data' }, 500);
  }
});

// Get driver performance metrics
dashboard.get('/drivers/performance', async (c) => {
  try {
    const user = c.get('user');
    const period = c.req.query('period') || '30'; // days

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

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
    `).all(period, user.businessId);

    return c.json({
      success: true,
      data: { driverPerformance },
    });

  } catch (error) {
    console.error('Get driver performance error:', error);
    return c.json({ error: 'Failed to fetch driver performance' }, 500);
  }
});

export default dashboard;