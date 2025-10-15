import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { ResponseHandler } from '../utils/response.js';
import { DashboardService } from '../services/dashboard.service';
import { ServiceError, ForbiddenError } from '../types/services.js';

const dashboard = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Apply auth middleware to all routes
dashboard.use('*', authMiddleware);

// Get dashboard statistics
dashboard.get('/stats', async (c) => {
  try {
    const user = c.get('user');
    const period = c.req.query('period') || '30';
    const allowed = ['7','14','30','90'];
    const periodClamped = allowed.includes(period) ? period : '30';

    // Validate permissions
    DashboardService.validateDashboardAccess(user.role);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const stats = await DashboardService.getStats(user.businessId, periodClamped);

    return ResponseHandler.success(c, stats);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch dashboard statistics');
  }
});

// Get real-time activity feed
dashboard.get('/activity', async (c) => {
  try {
    const user = c.get('user');
    const limitRaw = parseInt(c.req.query('limit') || '20');
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

    // Validate permissions
    DashboardService.validateDashboardAccess(user.role);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const activity = await DashboardService.getActivity(user.businessId, limit);

    return ResponseHandler.success(c, { activity });

  } catch (error) {
    console.error('Get dashboard activity error:', error);
    
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch dashboard activity');
  }
});

// Get map data for dashboard
dashboard.get('/map', async (c) => {
  try {
    const user = c.get('user');

    // Validate permissions
    DashboardService.validateDashboardAccess(user.role);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const mapData = await DashboardService.getMapData(user.businessId);

    return ResponseHandler.success(c, mapData);

  } catch (error) {
    console.error('Get dashboard map data error:', error);
    
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch map data');
  }
});

// Get driver performance metrics
dashboard.get('/drivers/performance', async (c) => {
  try {
    const user = c.get('user');
    const period = c.req.query('period') || '30';

    // Validate permissions
    DashboardService.validateDashboardAccess(user.role);

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const driverPerformance = await DashboardService.getDriverPerformance(user.businessId, period);

    return ResponseHandler.success(c, { driverPerformance });

  } catch (error: unknown) {
    console.error('Get driver performance error:', error);
    
    if (error instanceof ForbiddenError) {
      return ResponseHandler.forbidden(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch driver performance');
  }
});

export default dashboard;