import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateId } from '@zoneflow/shared';
import db from '../database/connection.js';
import { validateRequest, registerSchema, loginSchema, createBusinessSchema } from '../utils/validation.js';

const auth = new Hono();

// Register endpoint
auth.post('/register', async (c) => {
  try {
    const body = await c.req.json();
    const data = validateRequest(registerSchema, body);

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (existingUser) {
      return c.json({ error: 'User already exists with this email' }, 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);
    const userId = generateId();

    // Start transaction
    const transaction = db.transaction(() => {
      // Create user
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, phone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(userId, data.email, passwordHash, data.name, data.role, data.phone || null);

      // If business owner, create business
      let businessId = null;
      if (data.role === 'business_owner') {
        businessId = generateId();
        db.prepare(`
          INSERT INTO businesses (id, name, owner_id, email, phone)
          VALUES (?, ?, ?, ?, ?)
        `).run(businessId, `${data.name}'s Business`, userId, data.email, data.phone || null);

        // Update user with business_id
        db.prepare('UPDATE users SET business_id = ? WHERE id = ?').run(businessId, userId);
      }

      return { userId, businessId };
    });

    const result = transaction();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.userId, 
        email: data.email, 
        role: data.role,
        businessId: result.businessId 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return c.json({
      success: true,
      data: {
        user: {
          id: result.userId,
          email: data.email,
          name: data.name,
          role: data.role,
          businessId: result.businessId,
        },
        token,
      },
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Registration failed' 
    }, 400);
  }
});

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const body = await c.req.json();
    const data = validateRequest(loginSchema, body);

    // Find user
    const user = db.prepare(`
      SELECT id, email, password_hash, name, role, business_id, is_active
      FROM users 
      WHERE email = ?
    `).get(data.email);

    if (!user || !user.is_active) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        businessId: user.business_id 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business_id,
        },
        token,
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Login failed' 
    }, 400);
  }
});

// Get current user profile
auth.get('/me', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    const user = db.prepare(`
      SELECT id, email, name, role, business_id, phone, created_at
      FROM users 
      WHERE id = ? AND is_active = 1
    `).get(decoded.userId);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          businessId: user.business_id,
          phone: user.phone,
          createdAt: user.created_at,
        },
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get user profile' }, 400);
  }
});

// Refresh token endpoint
auth.post('/refresh', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;

    // Generate new token
    const newToken = jwt.sign(
      { 
        userId: decoded.userId, 
        email: decoded.email, 
        role: decoded.role,
        businessId: decoded.businessId 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return c.json({
      success: true,
      data: { token: newToken },
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    return c.json({ error: 'Failed to refresh token' }, 401);
  }
});

export default auth;