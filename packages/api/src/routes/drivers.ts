import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validateRequest, createDriverSchema, bulkCreateDriverSchema, updateDriverSchema } from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { DriverService } from '../services/driver.service.js';
import { FileImportService } from '../utils/file-import.js';
import { ServiceError, NotFoundError, ValidationError, ConflictError } from '../types/services.js';

const drivers = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Apply auth middleware to all routes
drivers.use('*', authMiddleware);

// Get all drivers for a business
drivers.get('/', async (c) => {
  try {
    const user = c.get('user');
    const pageRaw = parseInt(c.req.query('page') || '1');
    const limitRaw = parseInt(c.req.query('limit') || '20');
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitClamped = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

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
drivers.post('/', requireRole(['admin','business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Validate request data
    const driverData = validateRequest(createDriverSchema, body);

    const driver = await DriverService.createDriver(user.businessId, driverData);
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
drivers.post('/bulk', requireRole(['admin','business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    // Validate request data
    const bulkData = validateRequest(bulkCreateDriverSchema, body);

    const result = await DriverService.createDriversBulk(user.businessId, bulkData);
    
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
drivers.post('/import', requireRole(['admin','business_owner']), async (c) => {
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
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!allowedTypes.includes(fileExt)) {
      return ResponseHandler.badRequest(c, 'Invalid file type. Only Excel and CSV files are allowed.');
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
      return ResponseHandler.badRequest(c, 'No valid driver data found in file');
    }

    // Create drivers in bulk
    const result = await DriverService.createDriversBulk(user.businessId, { drivers: driverData });
    
    // Return appropriate status based on results
    if (result.failed === 0) {
      return ResponseHandler.created(c, {
        message: `Successfully imported ${result.success} drivers`,
        ...result
      });
    } else if (result.success === 0) {
      return ResponseHandler.badRequest(c, 'All drivers failed to import');
    } else {
      return ResponseHandler.success(c, {
        message: `Imported ${result.success} drivers with ${result.failed} failures`,
        ...result
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
drivers.put('/:id', requireRole(['admin','business_owner']), async (c) => {
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

    const driver = await DriverService.updateDriver(driverId, user.businessId, updateData);
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
drivers.delete('/:id', requireRole(['admin','business_owner']), async (c) => {
  try {
    const user = c.get('user');
    const driverId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    await DriverService.deleteDriver(driverId, user.businessId);
    return ResponseHandler.success(c, { message: 'Driver deleted successfully' });

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