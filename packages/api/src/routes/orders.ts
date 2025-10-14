import { Hono } from 'hono';
import { generateId, generateTrackingCode } from '@zoneflow/shared';
import db from '../database/connection.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRequest, createOrderSchema, updateOrderStatusSchema } from '../utils/validation.js';

const orders = new Hono();

// Apply auth middleware to all routes
orders.use('*', authMiddleware);

// Get all orders for a business
orders.get('/', async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const offset = (page - 1) * limit;

    let query = `
      SELECT o.*, d.user_id as driver_user_id, u.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE o.business_id = ?
    `;
    const params: any[] = [user.businessId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND o.priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const ordersData = db.prepare(query).all(...params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE business_id = ?';
    const countParams: any[] = [user.businessId];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (priority) {
      countQuery += ' AND priority = ?';
      countParams.push(priority);
    }

    const { total } = db.prepare(countQuery).get(...countParams) as { total: number };

    return c.json({
      success: true,
      data: {
        orders: ordersData,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Get orders error:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

// Get single order
orders.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');

    const order = db.prepare(`
      SELECT o.*, d.user_id as driver_user_id, u.name as driver_name, u.phone as driver_phone
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE o.id = ? AND o.business_id = ?
    `).get(orderId, user.businessId);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get location history for this order
    const locationHistory = db.prepare(`
      SELECT latitude, longitude, timestamp, accuracy, speed, heading
      FROM location_history
      WHERE order_id = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `).all(orderId);

    return c.json({
      success: true,
      data: {
        order,
        locationHistory,
      },
    });

  } catch (error) {
    console.error('Get order error:', error);
    return c.json({ error: 'Failed to fetch order' }, 500);
  }
});

// Create new order
orders.post('/', async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const data = validateRequest(createOrderSchema, body);

    const orderId = generateId();
    const trackingCode = generateTrackingCode();

    db.prepare(`
      INSERT INTO orders (
        id, tracking_code, business_id, customer_name, customer_phone, customer_email,
        pickup_address, pickup_latitude, pickup_longitude,
        delivery_address, delivery_latitude, delivery_longitude,
        status, priority, estimated_delivery, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId, trackingCode, user.businessId, data.customerName, 
      data.customerPhone || null, data.customerEmail || null,
      data.pickupAddress, data.pickupLatitude, data.pickupLongitude,
      data.deliveryAddress, data.deliveryLatitude, data.deliveryLongitude,
      'pending', data.priority, data.estimatedDelivery || null, data.notes || null
    );

    const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    return c.json({
      success: true,
      data: { order: newOrder },
    }, 201);

  } catch (error) {
    console.error('Create order error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    }, 400);
  }
});

// Update order status
orders.patch('/:id/status', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');
    const body = await c.req.json();
    const data = validateRequest(updateOrderStatusSchema, body);

    // Check if order exists and belongs to user's business
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
      .get(orderId, user.businessId);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Update order status
    const updateData: any = {
      status: data.status,
      updated_at: new Date().toISOString(),
    };

    if (data.notes) {
      updateData.notes = data.notes;
    }

    // Set timestamps based on status
    if (data.status === 'picked_up' && !order.actual_pickup) {
      updateData.actual_pickup = new Date().toISOString();
    } else if (data.status === 'delivered' && !order.actual_delivery) {
      updateData.actual_delivery = new Date().toISOString();
    }

    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);

    db.prepare(`UPDATE orders SET ${updateFields} WHERE id = ?`)
      .run(...updateValues, orderId);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

    return c.json({
      success: true,
      data: { order: updatedOrder },
    });

  } catch (error) {
    console.error('Update order status error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Failed to update order status' 
    }, 400);
  }
});

// Assign driver to order
orders.patch('/:id/assign', async (c) => {
  try {
    const user = c.get('user');
    const orderId = c.req.param('id');
    const { driverId } = await c.req.json();

    // Check if order exists and belongs to user's business
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND business_id = ?')
      .get(orderId, user.businessId);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Check if driver exists and belongs to the same business
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND business_id = ?')
      .get(driverId, user.businessId);

    if (!driver) {
      return c.json({ error: 'Driver not found' }, 404);
    }

    // Update order with driver assignment
    db.prepare(`
      UPDATE orders 
      SET driver_id = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(driverId, orderId);

    const updatedOrder = db.prepare(`
      SELECT o.*, d.user_id as driver_user_id, u.name as driver_name
      FROM orders o
      LEFT JOIN drivers d ON o.driver_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      WHERE o.id = ?
    `).get(orderId);

    return c.json({
      success: true,
      data: { order: updatedOrder },
    });

  } catch (error) {
    console.error('Assign driver error:', error);
    return c.json({ error: 'Failed to assign driver' }, 500);
  }
});

// Get order by tracking code (public endpoint)
orders.get('/track/:trackingCode', async (c) => {
  try {
    const trackingCode = c.req.param('trackingCode');

    const order = db.prepare(`
      SELECT 
        id, tracking_code, customer_name, pickup_address, delivery_address,
        status, priority, estimated_delivery, actual_pickup, actual_delivery,
        created_at, updated_at
      FROM orders 
      WHERE tracking_code = ?
    `).get(trackingCode);

    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }

    // Get recent location updates (last 10)
    const locationHistory = db.prepare(`
      SELECT latitude, longitude, timestamp
      FROM location_history
      WHERE order_id = ?
      ORDER BY timestamp DESC
      LIMIT 10
    `).all(order.id);

    return c.json({
      success: true,
      data: {
        order,
        locationHistory,
      },
    });

  } catch (error) {
    console.error('Track order error:', error);
    return c.json({ error: 'Failed to track order' }, 500);
  }
});

export default orders;