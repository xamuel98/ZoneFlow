import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import db from '../database/connection.js';
import { AppContext } from '../types/context.js';
import { ResponseHandler } from '../utils/response.js';

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
      return ResponseHandler.unauthorized(c, 'Authorization token required');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET!;
    
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
      return ResponseHandler.unauthorized(c, 'Invalid or expired token');
    }

    // Add user info to context
    c.set('user', {
      id: user.id,
      email: user.email,
      role: user.role,
      businessId: user.business_id || undefined,
    });

    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return ResponseHandler.unauthorized(c, 'Invalid token');
  }
};

export const requireRole = (roles: string[]) => {
  return async (c: AppContext, next: Next) => {
    const user = c.get('user');
    
    if (!user || !roles.includes(user.role)) {
      return ResponseHandler.forbidden(c, 'Insufficient permissions');
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
    return ResponseHandler.forbidden(c, 'Access denied to this business');
  }

  await next();
};