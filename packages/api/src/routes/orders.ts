import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, createOrderSchema, updateOrderStatusSchema } from '../utils/validation.js';
import { ResponseHandler } from '../utils/response.js';
import { OrderService } from '../services/OrderService.js';
import { ServiceError, NotFoundError, ValidationError } from '../types/services.js';
import type { OrderFilters, CreateOrderData, UpdateOrderStatusData } from '../types/services.js';

const orders = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Apply auth middleware to all routes
orders.use('*', authMiddleware);

// Get all orders for a business
orders.get('/', async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    
    const filters: OrderFilters = {
      status: c.req.query('status'),
      priority: c.req.query('priority'),
      driverId: c.req.query('driverId'),
    };

    const pagination = {
      page,
      limit,
      offset: (page - 1) * limit,
    };

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.getOrders(user.businessId, filters, pagination);

    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Get orders error:', error);
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch orders');
  }
});

// Get single order
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.getOrderById(orderId, user.businessId);

    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Get order error:', error);
    
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Order');
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to fetch order');
  }
});

// Create new order
orders.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(createOrderSchema, body) as CreateOrderData;

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.createOrder(data, user.businessId);

    return ResponseHandler.created(c, { order: result });

  } catch (error: unknown) {
    console.error('Create order error:', error);
    
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.badRequest(c, error instanceof Error ? error.message : 'Failed to create order');
  }
});

// Update order status
orders.patch('/:id/status', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');
    const body = await c.req.json();
    const data = validateRequest(updateOrderStatusSchema, body) as UpdateOrderStatusData;

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.updateOrderStatus(orderId, data, user.businessId);

    return ResponseHandler.success(c, { order: result });

  } catch (error: unknown) {
    console.error('Update order status error:', error);
    
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Order');
    }
    
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.badRequest(c, error instanceof Error ? error.message : 'Failed to update order status');
  }
});

// Assign driver to order
orders.patch('/:id/assign', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');
    const { driverId } = await c.req.json();

    if (!driverId) {
      return ResponseHandler.badRequest(c, 'Driver ID is required');
    }

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.assignDriver(orderId, driverId, user.businessId);

    return ResponseHandler.success(c, { order: result });

  } catch (error: unknown) {
    console.error('Assign driver error:', error);
    
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, error.message);
    }
    
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to assign driver');
  }
});

// Get order by tracking code (public endpoint)
orders.get('/track/:trackingCode', async (c) => {
  try {
    const trackingCode = c.req.param('trackingCode');

    const result = await OrderService.getOrderByTrackingCode(trackingCode);

    return ResponseHandler.success(c, result);

  } catch (error: unknown) {
    console.error('Track order error:', error);
    
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Order');
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to track order');
  }
});

// Cancel order
orders.patch('/:id/cancel', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');
    const { reason } = await c.req.json();

    // Validate businessId exists
    if (!user.businessId) {
      return ResponseHandler.forbidden(c, 'Business access required');
    }

    const result = await OrderService.cancelOrder(orderId, user.businessId, reason);

    return ResponseHandler.success(c, { order: result });

  } catch (error: unknown) {
    console.error('Cancel order error:', error);
    
    if (error instanceof NotFoundError) {
      return ResponseHandler.notFound(c, 'Order');
    }
    
    if (error instanceof ValidationError) {
      return ResponseHandler.badRequest(c, error.message);
    }
    
    if (error instanceof ServiceError) {
      return ResponseHandler.serverError(c, error.message);
    }
    
    return ResponseHandler.serverError(c, 'Failed to cancel order');
  }
});

export default orders;