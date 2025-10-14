import { Hono } from 'hono';
import { generateId } from '@zoneflow/shared';
import db from '../database/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, updateLocationSchema } from '../utils/validation.js';

const location = new Hono();

// Apply auth middleware to all routes
location.use('*', authMiddleware);

// Update driver location
location.post('/update', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(updateLocationSchema, body);

    // Get driver info for the current user
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);

    if (!driver) {
      return c.json({ error: 'Driver profile not found' }, 404);
    }

    // Update driver's current location
    db.prepare(`
      UPDATE drivers 
      SET current_latitude = ?, current_longitude = ?, last_location_update = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.latitude, data.longitude, driver.id);

    // Record location history
    const historyId = generateId();
    db.prepare(`
      INSERT INTO location_history (
        id, driver_id, order_id, latitude, longitude, accuracy, speed, heading
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      historyId, driver.id, data.orderId || null, data.latitude, data.longitude,
      data.accuracy || null, data.speed || null, data.heading || null
    );

    // Check geofences if order is provided
    let geofenceEvents = [];
    if (data.orderId) {
      try {
        // Call geofence check endpoint internally
        const geofenceResponse = await fetch(`${c.req.url.replace('/location/update', '/geofences/check')}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': c.req.header('Authorization') || '',
          },
          body: JSON.stringify({
            latitude: data.latitude,
            longitude: data.longitude,
            driverId: driver.id,
            orderId: data.orderId,
          }),
        });

        if (geofenceResponse.ok) {
          const geofenceData = await geofenceResponse.json();
          geofenceEvents = geofenceData.data?.triggeredGeofences || [];
        }
      } catch (error) {
        console.warn('Failed to check geofences:', error);
      }
    }

    return c.json({
      success: true,
      data: {
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date().toISOString(),
        },
        geofenceEvents,
      },
    });

  } catch (error) {
    console.error('Update location error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to update location' 
    }, 400);
  }
});

// Get driver's location history
location.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.query('orderId');
    const limit = parseInt(c.req.query('limit') || '50');
    const page = parseInt(c.req.query('page') || '1');
    const offset = (page - 1) * limit;

    // Get driver info for the current user
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);

    if (!driver) {
      return c.json({ error: 'Driver profile not found' }, 404);
    }

    let query = `
      SELECT lh.*, o.tracking_code
      FROM location_history lh
      LEFT JOIN orders o ON lh.order_id = o.id
      WHERE lh.driver_id = ?
    `;
    const params: any[] = [driver.id];

    if (orderId) {
      query += ' AND lh.order_id = ?';
      params.push(orderId);
    }

    query += ' ORDER BY lh.timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const history = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM location_history WHERE driver_id = ?';
    const countParams: any[] = [driver.id];

    if (orderId) {
      countQuery += ' AND order_id = ?';
      countParams.push(orderId);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    return c.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Get location history error:', error);
    return c.json({ error: 'Failed to fetch location history' }, 500);
  }
});

// Get current location of all drivers in a business
location.get('/drivers', async (c) => {
  try {
    const user = c.get('user');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const drivers = db.prepare(`
      SELECT 
        d.id, d.current_latitude, d.current_longitude, d.last_location_update,
        d.is_available, d.vehicle_type, d.license_plate,
        u.name, u.phone, u.email,
        COUNT(o.id) as active_orders
      FROM drivers d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN orders o ON d.id = o.driver_id AND o.status IN ('assigned', 'picked_up', 'in_transit')
      WHERE d.business_id = ?
      GROUP BY d.id
      ORDER BY d.last_location_update DESC
    `).all(user.businessId);

    return c.json({
      success: true,
      data: { drivers },
    });

  } catch (error) {
    console.error('Get drivers location error:', error);
    return c.json({ error: 'Failed to fetch drivers location' }, 500);
  }
});

// Get location history for a specific order (business owner view)
location.get('/order/:orderId', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('orderId');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    // Verify order belongs to user's business
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
      .get(orderId, user.businessId);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get location history for this order
    const history = db.prepare(`
      SELECT 
        lh.*,
        d.user_id as driver_user_id,
        u.name as driver_name
      FROM location_history lh
      JOIN drivers d ON lh.driver_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE lh.order_id = ?
      ORDER BY lh.timestamp ASC
    `).all(orderId);

    // Get geofence events for this order
    const geofenceEvents = db.prepare(`
      SELECT 
        ge.*,
        g.name as geofence_name,
        g.type as geofence_type
      FROM geofence_events ge
      JOIN geofences g ON ge.geofence_id = g.id
      WHERE ge.order_id = ?
      ORDER BY ge.timestamp ASC
    `).all(orderId);

    return c.json({
      success: true,
      data: {
        order,
        locationHistory: history,
        geofenceEvents,
      },
    });

  } catch (error) {
    console.error('Get order location history error:', error);
    return c.json({ error: 'Failed to fetch order location history' }, 500);
  }
});

// Update driver availability status
location.patch('/availability', async (c) => {
  try {
    const user = c.get('user');
    const { isAvailable } = await c.req.json();

    if (typeof isAvailable !== 'boolean') {
      return c.json({ error: 'isAvailable must be a boolean' }, 400);
    }

    // Get driver info for the current user
    const driver = db.prepare('SELECT * FROM drivers WHERE user_id = ?').get(user.id);

    if (!driver) {
      return c.json({ error: 'Driver profile not found' }, 404);
    }

    // Update driver availability
    db.prepare('UPDATE drivers SET is_available = ? WHERE id = ?')
      .run(isAvailable ? 1 : 0, driver.id);

    const updatedDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver.id);

    return c.json({
      success: true,
      data: { driver: updatedDriver },
    });

  } catch (error) {
    console.error('Update availability error:', error);
    return c.json({ error: 'Failed to update availability' }, 500);
  }
});

export default location;