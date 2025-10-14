import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, updateLocationSchema } from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { LocationService } from '../services/LocationService.js';
import { ServiceError, NotFoundError, ValidationError, ForbiddenError } from '../types/services.js';

const location = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Apply auth middleware to all routes
location.use('*', authMiddleware);

// Update driver location
location.post('/update', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(updateLocationSchema, body);

    const result = await LocationService.updateDriverLocation(user.id, {
      latitude: data.latitude,
      longitude: data.longitude,
      orderId: data.orderId,
    });

    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Update location error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver profile');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.badRequest(c, error instanceof Error ? error.message : 'Failed to update location');
  }
});

// Get location history for current driver
location.get('/history', async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '50');
    const orderId = c.req.query('orderId');

    const result = await LocationService.getLocationHistory(user.id, {
      page,
      limit,
      orderId,
    });

    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Get location history error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver profile');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch location history');
  }
});

// Get current location of all drivers in a business
location.get('/drivers', async (c) => {
  try {
    const user = c.get('user');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return ResponseHandler.forbidden(c, 'Insufficient permissions');
    }

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const drivers = await LocationService.getDriversWithLocations(user.businessId);
    return ResponseHandler.success(c, { drivers });

  } catch (error: unknown) {
    console.error('Get drivers location error:', error);
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch drivers location');
  }
});

// Get location history for a specific order (business owner view)
location.get('/order/:orderId', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('orderId');

    if (user.role !== 'business_owner' && user.role !== 'admin') {
      return ResponseHandler.forbidden(c, 'Insufficient permissions');
    }

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await LocationService.getOrderLocationHistory(orderId, user.businessId);
    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Get order location history error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Order');
    }
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch order location history');
  }
});

// Update driver availability status
location.patch('/availability', async (c) => {
  try {
    const user = c.get('user');
    const { isAvailable } = await c.req.json();

    if (typeof isAvailable !== 'boolean') {
      return ResponseHandler.badRequest(c, 'isAvailable must be a boolean');
    }

    const driver = await LocationService.updateDriverAvailability(user.id, isAvailable);
    return ResponseHandler.success(c, { driver });

  } catch (error: unknown) {
    console.error('Update availability error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver profile');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to update availability');
  }
});

export default location;