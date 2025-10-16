import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import {
  validateRequest,
  createDriverSchema,
  bulkCreateDriverSchema,
  updateDriverSchema,
  createInvitationSchema,
  bulkCancelInvitationsSchema,
  invitationListFilterSchema,
  acceptInviteSchema,
} from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { DriverService } from '../services/driver.service.js';
import { DriverInvitationService } from '../services/driver-invitation.service.js';
import { DashboardService } from '../services/dashboard.service.js';
import { FileImportService } from '../utils/file-import.js';
import {
  ServiceError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../types/services.js';

const drivers = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// ===== PUBLIC INVITATION ENDPOINTS (no auth required) =====

// Get invitation by token (public)
drivers.get('/invitations/token/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const invitation = await DriverInvitationService.getInvitationByToken(token);
    return ResponseHandler.success(c, invitation);

  } catch (error: unknown) {
    console.error('Get invitation by token error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Invitation');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch invitation');
  }
});

// Accept invitation (public)
drivers.post('/accept-invitation', async (c) => {
  try {
    const body = await c.req.json();
    const { token, password } = validateRequest(acceptInviteSchema, body);
    
    const result = await DriverInvitationService.acceptInvitation(token, password);
    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Accept invitation error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Invitation');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ConflictError) {
      return ResponseHandler.conflict(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to accept invitation');
  }
});

// Apply auth middleware to all other routes
drivers.use('*', authMiddleware);

// Get all drivers for a business
drivers.get('/', async (c) => {
  try {
    const user = c.get('user');
    const pageRaw = parseInt(c.req.query('page') || '1');
    const limitRaw = parseInt(c.req.query('limit') || '20');
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitClamped = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 20;

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const pagination = {
      page,
      limit: limitClamped,
      offset: (page - 1) * limitClamped,
    };

    const result = await DriverService.getDrivers(user.businessId, pagination);
    return ResponseHandler.success(c, result);
  } catch (error: unknown) {
    console.error('Get drivers error:', error);
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch drivers');
  }
});

// Get driver statistics for a business
drivers.get('/stats', async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const stats = await DriverService.getDriverStats(user.businessId);
    return ResponseHandler.success(c, stats);
  } catch (error: unknown) {
    console.error('Get driver stats error:', error);
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch driver statistics');
  }
});

// ===== INVITATION ENDPOINTS =====

// Get all invitations for a business
drivers.get('/invitations', async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const pageRaw = parseInt(c.req.query('page') || '1');
    const limitRaw = parseInt(c.req.query('limit') || '10');
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitClamped = Number.isFinite(limitRaw)
      ? Math.min(Math.max(limitRaw, 1), 100)
      : 10;
    const status = c.req.query('status');

    // Validate status if provided
    if (status && !['pending', 'accepted', 'cancelled', 'expired'].includes(status)) {
      return ResponseHandler.badRequest(c, 'Invalid status value');
    }

    const pagination = {
      page,
      limit: limitClamped,
      offset: (page - 1) * limitClamped,
    };

    const result = await DriverInvitationService.getInvitations(
      user.businessId,
      pagination
    );
    return ResponseHandler.success(c, result);
  } catch (error: unknown) {
    console.error('Get invitations error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch invitations');
  }
});

// Create a new invitation
drivers.post('/invitations', async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const body = await c.req.json();
    const invitationData = validateRequest(createInvitationSchema, body);

    const invitation = await DriverInvitationService.createInvitation(
      user.businessId,
      user.id,
      invitationData
    );

    return ResponseHandler.created(c, invitation);
  } catch (error: unknown) {
    console.error('Create invitation error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ConflictError) {
      return ResponseHandler.conflict(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to create invitation');
  }
});

// Get invitation statistics
drivers.get('/invitations/stats', async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const stats = await DriverInvitationService.getInvitationStats(
      user.businessId
    );
    return ResponseHandler.success(c, stats);
  } catch (error: unknown) {
    console.error('Get invitation stats error:', error);
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(
      c,
      'Failed to fetch invitation statistics'
    );
  }
});

// Get specific invitation
drivers.get('/invitations/:id', async (c) => {
  try {
    const user = c.get('user');
    const invitationId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const invitation = await DriverInvitationService.getInvitationById(
      invitationId,
      user.businessId
    );
    return ResponseHandler.success(c, invitation);
  } catch (error: unknown) {
    console.error('Get invitation error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Invitation');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch invitation');
  }
});

// Cancel invitation
drivers.patch('/invitations/:id/cancel', async (c) => {
  try {
    const user = c.get('user');
    const invitationId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    await DriverInvitationService.cancelInvitation(
      invitationId,
      user.businessId
    );
    return ResponseHandler.success(c, {
      message: 'Invitation cancelled successfully',
    });
  } catch (error: unknown) {
    console.error('Cancel invitation error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Invitation');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to cancel invitation');
  }
});

// Bulk cancel invitations
drivers.post('/invitations/bulk-cancel', async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const body = await c.req.json();
    const { invitationIds } = validateRequest(
      bulkCancelInvitationsSchema,
      body
    );

    await DriverInvitationService.bulkCancelInvitations(
      invitationIds,
      user.businessId
    );
    return ResponseHandler.success(c, {
      message: 'Invitations cancelled successfully',
    });
  } catch (error: unknown) {
    console.error('Bulk cancel invitations error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to cancel invitations');
  }
});

// ===== PUBLIC INVITATION ENDPOINTS (no auth required) =====

// Get invitation by token (public)
drivers.get('/invitations/token/:token', async (c) => {
  try {
    const token = c.req.param('token');
    const invitation =
      await DriverInvitationService.getInvitationByToken(token);
    return ResponseHandler.success(c, invitation);
  } catch (error: unknown) {
    console.error('Get invitation by token error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Invitation');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch invitation');
  }
});

// Accept invitation (public)


// Get single driver
drivers.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const driverId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const driver = await DriverService.getDriverById(driverId, user.businessId);
    return ResponseHandler.success(c, { driver });
  } catch (error: unknown) {
    console.error('Get driver error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver');
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to fetch driver');
  }
});

// Create a single driver
drivers.post('/', requireRole(['admin', 'business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Validate request data
    const driverData = validateRequest(createDriverSchema, body);

    const driver = await DriverService.createDriver(
      user.businessId,
      driverData
    );
    return ResponseHandler.created(c, { driver });
  } catch (error: unknown) {
    console.error('Create driver error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ConflictError) {
      return ResponseHandler.conflict(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to create driver');
  }
});

// Create multiple drivers in bulk
drivers.post('/bulk', requireRole(['admin', 'business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Validate request data
    const bulkData = validateRequest(bulkCreateDriverSchema, body);

    const result = await DriverService.createDriversBulk(
      user.businessId,
      bulkData
    );

    // Return appropriate status based on results
    if (result.failed === 0) {
      return ResponseHandler.created(c, result);
    } else if (result.success === 0) {
      return ResponseHandler.badRequest(c, 'All drivers failed to create');
    } else {
      return ResponseHandler.success(c, result);
    }
  } catch (error: unknown) {
    console.error('Bulk create drivers error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to create drivers in bulk');
  }
});

// Import drivers from file (Excel/CSV)
drivers.post('/import', requireRole(['admin', 'business_owner']), async (c) => {
  try {
    const user = c.get('user');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Get the uploaded file from form data
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return ResponseHandler.badRequest(c, 'No file uploaded');
    }

    // Validate file type
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExt)) {
      return ResponseHandler.badRequest(
        c,
        'Invalid file type. Only Excel and CSV files are allowed.'
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse file and extract driver data
    const driverData = await FileImportService.processFileImport(
      buffer,
      file.name,
      { skipFirstRow: true }
    );

    if (driverData.length === 0) {
      return ResponseHandler.badRequest(
        c,
        'No valid driver data found in file'
      );
    }

    // Create drivers in bulk
    const result = await DriverService.createDriversBulk(user.businessId, {
      drivers: driverData,
    });

    // Return appropriate status based on results
    if (result.failed === 0) {
      return ResponseHandler.created(c, {
        message: `Successfully imported ${result.success} drivers`,
        ...result,
      });
    } else if (result.success === 0) {
      return ResponseHandler.badRequest(c, 'All drivers failed to import');
    } else {
      return ResponseHandler.success(c, {
        message: `Imported ${result.success} drivers with ${result.failed} failures`,
        ...result,
      });
    }
  } catch (error: unknown) {
    console.error('Import drivers error:', error);
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to import drivers');
  }
});

// Update driver
drivers.put('/:id', requireRole(['admin', 'business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const driverId = c.req.param('id');
    const body = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Validate request data (partial update)
    const updateData = validateRequest(updateDriverSchema, body);

    const driver = await DriverService.updateDriver(
      driverId,
      user.businessId,
      updateData
    );
    return ResponseHandler.success(c, { driver });
  } catch (error: unknown) {
    console.error('Update driver error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ConflictError) {
      return ResponseHandler.conflict(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to update driver');
  }
});

// Delete driver
drivers.delete('/:id', requireRole(['admin', 'business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const driverId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    await DriverService.deleteDriver(driverId, user.businessId);
    return ResponseHandler.success(c, {
      message: 'Driver deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Delete driver error:', error);
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Driver');
    }
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    return ResponseHandler.serverError(c, 'Failed to delete driver');
  }
});

export default drivers;
