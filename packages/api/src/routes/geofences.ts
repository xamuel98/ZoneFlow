import { Hono } from 'hono';
import { generateId, calculateDistance } from '@zoneflow/shared';
import db from '../database/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, createGeofenceSchema } from '../utils/validation.js';

const geofences = new Hono();

// Apply auth middleware to all routes
geofences.use('*', authMiddleware);

// Get all geofences for a business
geofences.get('/', async (c) => {
  try {
    const user = c.get('user');
    const type = c.req.query('type');

    let query = 'SELECT * FROM geofences WHERE business_id = ?';
    const params: any[] = [user.businessId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC';

    const geofencesData = db.prepare(query).all(...params);

    return c.json({
      success: true,
      data: { geofences: geofencesData },
    });

  } catch (error) {
    console.error('Get geofences error:', error);
    return c.json({ error: 'Failed to fetch geofences' }, 500);
  }
});

// Get single geofence
geofences.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
      .get(geofenceId, user.businessId);

    if (!geofence) {
      return c.json({ error: 'Geofence not found' }, 404);
    }

    // Get recent events for this geofence
    const events = db.prepare(`
      SELECT ge.*, d.user_id as driver_user_id, u.name as driver_name, o.tracking_code
      FROM geofence_events ge
      LEFT JOIN drivers d ON ge.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN orders o ON ge.order_id = o.id
      WHERE ge.geofence_id = ?
      ORDER BY ge.timestamp DESC
      LIMIT 20
    `).all(geofenceId);

    return c.json({
      success: true,
      data: {
        geofence,
        events,
      },
    });

  } catch (error) {
    console.error('Get geofence error:', error);
    return c.json({ error: 'Failed to fetch geofence' }, 500);
  }
});

// Create new geofence
geofences.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(createGeofenceSchema, body);

    const geofenceId = generateId();

    db.prepare(`
      INSERT INTO geofences (
        id, business_id, name, type, center_latitude, center_longitude, radius
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      geofenceId, user.businessId, data.name, data.type,
      data.centerLatitude, data.centerLongitude, data.radius
    );

    const newGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId);

    return c.json({
      success: true,
      data: { geofence: newGeofence },
    }, 201);

  } catch (error) {
    console.error('Create geofence error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create geofence' 
    }, 400);
  }
});

// Update geofence
geofences.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');
    const body = await c.req.json();
    const data = validateRequest(createGeofenceSchema, body);

    // Check if geofence exists and belongs to user's business
    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
      .get(geofenceId, user.businessId);

    if (!geofence) {
      return c.json({ error: 'Geofence not found' }, 404);
    }

    // Update geofence
    db.prepare(`
      UPDATE geofences 
      SET name = ?, type = ?, center_latitude = ?, center_longitude = ?, radius = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(data.name, data.type, data.centerLatitude, data.centerLongitude, data.radius, geofenceId);

    const updatedGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId);

    return c.json({
      success: true,
      data: { geofence: updatedGeofence },
    });

  } catch (error) {
    console.error('Update geofence error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to update geofence' 
    }, 400);
  }
});

// Delete geofence
geofences.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    // Check if geofence exists and belongs to user's business
    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
      .get(geofenceId, user.businessId);

    if (!geofence) {
      return c.json({ error: 'Geofence not found' }, 404);
    }

    // Delete geofence (events will be kept for historical purposes)
    db.prepare('DELETE FROM geofences WHERE id = ?').run(geofenceId);

    return c.json({
      success: true,
      message: 'Geofence deleted successfully',
    });

  } catch (error) {
    console.error('Delete geofence error:', error);
    return c.json({ error: 'Failed to delete geofence' }, 500);
  }
});

// Toggle geofence active status
geofences.patch('/:id/toggle', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    // Check if geofence exists and belongs to user's business
    const geofence = db.prepare('SELECT * FROM geofences WHERE id = ? AND business_id = ?')
      .get(geofenceId, user.businessId);

    if (!geofence) {
      return c.json({ error: 'Geofence not found' }, 404);
    }

    // Toggle active status
    const newStatus = geofence.is_active ? 0 : 1;
    db.prepare('UPDATE geofences SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(newStatus, geofenceId);

    const updatedGeofence = db.prepare('SELECT * FROM geofences WHERE id = ?').get(geofenceId);

    return c.json({
      success: true,
      data: { geofence: updatedGeofence },
    });

  } catch (error) {
    console.error('Toggle geofence error:', error);
    return c.json({ error: 'Failed to toggle geofence status' }, 500);
  }
});

// Check if a location triggers any geofences
geofences.post('/check', async (c) => {
  try {
    const user = c.get('user');
    const { latitude, longitude, driverId, orderId } = await c.req.json();

    if (!latitude || !longitude || !driverId) {
      return c.json({ error: 'Latitude, longitude, and driverId are required' }, 400);
    }

    // Get all active geofences for the business
    const activeGeofences = db.prepare(`
      SELECT * FROM geofences 
      WHERE business_id = ? AND is_active = 1
    `).all(user.businessId);

    const triggeredGeofences = [];

    for (const geofence of activeGeofences) {
      const distance = calculateDistance(
        latitude, longitude,
        geofence.center_latitude, geofence.center_longitude
      );

      if (distance <= geofence.radius) {
        // Check if this is a new entry (not already inside)
        const lastEvent = db.prepare(`
          SELECT * FROM geofence_events 
          WHERE geofence_id = ? AND driver_id = ? 
          ORDER BY timestamp DESC 
          LIMIT 1
        `).get(geofence.id, driverId);

        const isNewEntry = !lastEvent || lastEvent.event_type === 'exit';

        if (isNewEntry) {
          // Record geofence entry event
          const eventId = generateId();
          db.prepare(`
            INSERT INTO geofence_events (
              id, geofence_id, driver_id, order_id, event_type, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(eventId, geofence.id, driverId, orderId || null, 'enter', latitude, longitude);

          triggeredGeofences.push({
            ...geofence,
            eventType: 'enter',
            distance,
          });
        }
      } else {
        // Check if driver was previously inside and now exited
        const lastEvent = db.prepare(`
          SELECT * FROM geofence_events 
          WHERE geofence_id = ? AND driver_id = ? 
          ORDER BY timestamp DESC 
          LIMIT 1
        `).get(geofence.id, driverId);

        if (lastEvent && lastEvent.event_type === 'enter') {
          // Record geofence exit event
          const eventId = generateId();
          db.prepare(`
            INSERT INTO geofence_events (
              id, geofence_id, driver_id, order_id, event_type, latitude, longitude
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(eventId, geofence.id, driverId, orderId || null, 'exit', latitude, longitude);

          triggeredGeofences.push({
            ...geofence,
            eventType: 'exit',
            distance,
          });
        }
      }
    }

    return c.json({
      success: true,
      data: { triggeredGeofences },
    });

  } catch (error) {
    console.error('Check geofences error:', error);
    return c.json({ error: 'Failed to check geofences' }, 500);
  }
});

export default geofences;