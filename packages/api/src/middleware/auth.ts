import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import { AppContext } from '../types/context.js';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  businessId?: string;
}

export const authMiddleware = async (c: AppContext, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Authorization token required' }, 401);
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    
    const decoded = jwt.verify(token, secret) as JWTPayload;
    
    // Verify user still exists and is active
    const user = db.prepare(`
      SELECT id, email, role, business_id, is_active 
      FROM users 
      WHERE id = ? AND is_active = 1
    `).get(decoded.userId) as {
      id: string;
      email: string;
      role: string;
      business_id: string;
      is_active: number;
    } | undefined;

    if (!user) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Add user info to context
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id,
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ error: 'Invalid token' }, 401);
  }
};

export const requireRole = (roles: string[]) => {
  return async (c: AppContext, next: Next) => {
    const user = c.get('user');
    
    if (!user || !roles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
};

export const requireBusinessAccess = async (c: AppContext, next: Next) => {
  const user = c.get('user');
  const businessId = c.req.param('businessId') || c.req.query('businessId');

  if (user.role === 'admin') {
    // Admins can access any business
    await next();
    return;
  }

  if (!businessId || user.businessId !== businessId) {
    return c.json({ error: 'Access denied to this business' }, 403);
  }

  await next();
};