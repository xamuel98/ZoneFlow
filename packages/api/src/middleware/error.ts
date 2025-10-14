import { Context } from 'hono';

export const errorHandler = (err: Error, c: Context) => {
  console.error('API Error:', err);

  // Database constraint errors
  if (err.message.includes('UNIQUE constraint failed')) {
    return c.json({ 
      error: 'Resource already exists',
      details: err.message 
    }, 409);
  }

  if (err.message.includes('FOREIGN KEY constraint failed')) {
    return c.json({ 
      error: 'Invalid reference to related resource',
      details: err.message 
    }, 400);
  }

  // JWT errors
  if (err.message.includes('jwt')) {
    return c.json({ 
      error: 'Authentication failed',
      details: 'Invalid or expired token' 
    }, 401);
  }

  // Validation errors
  if (err.message.includes('validation')) {
    return c.json({ 
      error: 'Validation failed',
      details: err.message 
    }, 400);
  }

  // Default server error
  return c.json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  }, 500);
};