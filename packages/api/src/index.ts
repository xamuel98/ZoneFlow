import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import geofenceRoutes from './routes/geofences.js';
import locationRoutes from './routes/location.js';
import dashboardRoutes from './routes/dashboard.js';

// Import middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';

// Load environment variables
dotenv.config();

const app = new Hono<{ Variables: { user: import('./types/context.js').AuthUser } }>();

// Global middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use('*', cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/orders', orderRoutes);
app.route('/api/geofences', geofenceRoutes);
app.route('/api/location', locationRoutes);
app.route('/api/dashboard', dashboardRoutes);

// Protected routes middleware (apply to specific routes)
app.use('/api/orders/*', authMiddleware);
app.use('/api/geofences/*', authMiddleware);
app.use('/api/location/*', authMiddleware);
app.use('/api/dashboard/*', authMiddleware);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 ZoneFlow API Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;