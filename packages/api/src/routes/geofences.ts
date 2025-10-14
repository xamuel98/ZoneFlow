import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, createGeofenceSchema } from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { GeofenceService } from '../services/GeofenceService.js';
import { ServiceError, NotFoundError, ValidationError } from '../types/services.js';

const geofences = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Apply auth middleware to all routes
geofences.use('*', authMiddleware);

// Get all geofences
geofences.get('/', async (c) => {
  try {
    const user = c.get('user');
    const type = c.req.query('type');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const geofenceList = await GeofenceService.getGeofences(user.businessId, type);
    return ResponseHandler.success(c, { geofences: geofenceList });

  } catch (error: unknown) {
    console.error('Get geofences error:', error);
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch geofences');
  }
});

// Get single geofence with recent events
geofences.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await GeofenceService.getGeofenceById(geofenceId, user.businessId);
    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Get geofence error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Geofence');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch geofence');
  }
});

// Create new geofence
geofences.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(createGeofenceSchema, body);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const geofence = await GeofenceService.createGeofence(data, user.businessId);

    return ResponseHandler.success(c, { geofence }, 'Geofence created successfully');

  } catch (error: unknown) {
    console.error('Create geofence error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.badRequest(c, error instanceof Error ? error.message : 'Failed to create geofence');
  }
});

// Update geofence
geofences.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');
    const body = await c.req.json();
    const data = validateRequest(createGeofenceSchema, body);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const geofence = await GeofenceService.updateGeofence(geofenceId, data, user.businessId);
    return ResponseHandler.success(c, { geofence });

  } catch (error: unknown) {
    console.error('Update geofence error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Geofence');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.badRequest(c, error instanceof Error ? error.message : 'Failed to update geofence');
  }
});

// Delete geofence
geofences.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    await GeofenceService.deleteGeofence(geofenceId, user.businessId);
    return ResponseHandler.success(c, null, 'Geofence deleted successfully');

  } catch (error: unknown) {
    console.error('Delete geofence error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Geofence');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to delete geofence');
  }
});

// Toggle geofence active status
geofences.patch('/:id/toggle', async (c) => {
  try {
    const user = c.get('user');
    const geofenceId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const geofence = await GeofenceService.toggleGeofenceStatus(geofenceId, user.businessId);
    return ResponseHandler.success(c, { geofence });

  } catch (error: unknown) {
    console.error('Toggle geofence error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Geofence');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to toggle geofence status');
  }
});

// Check if a location triggers any geofences
geofences.post('/check', async (c) => {
  try {
    const user = c.get('user');
    const { latitude, longitude, driverId, orderId } = await c.req.json();

    if (!latitude || !longitude || !driverId) {
      return ResponseHandler.badRequest(c, 'Latitude, longitude, and driverId are required');
    }

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const triggeredGeofences = await GeofenceService.checkGeofenceEntry(
      user.businessId,
      latitude,
      longitude,
      driverId,
      orderId
    );

    return ResponseHandler.success(c, { triggeredGeofences });

  } catch (error: unknown) {
    console.error('Check geofences error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to check geofences');
  }
});

export default geofences;