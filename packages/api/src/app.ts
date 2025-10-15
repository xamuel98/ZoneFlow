import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

// Routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import geofenceRoutes from './routes/geofences.js';
import locationRoutes from './routes/location.js';
import dashboardRoutes from './routes/dashboard.js';
import driverRoutes from './routes/drivers.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';

export type AppType = Hono<{ Variables: { user: import('./types/context.js').AuthUser } }>;

export function createApp(): AppType {
  const app = new Hono<{ Variables: { user: import('./types/context.js').AuthUser } }>();

  app.use('*', cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL || 'http://localhost:5173'
    ].filter(Boolean),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [ 'Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With' ],
    credentials: true,
    maxAge: 86400,
  }));

  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use('*', secureHeaders());

  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }));

  app.route('/api/auth', authRoutes);
  app.route('/api/orders', orderRoutes);
  app.route('/api/geofences', geofenceRoutes);
  app.route('/api/location', locationRoutes);
  app.route('/api/dashboard', dashboardRoutes);
  app.route('/api/drivers', driverRoutes);

  // Protected suffix middleware
  app.use('/api/orders/*', authMiddleware);
  app.use('/api/geofences/*', authMiddleware);
  app.use('/api/location/*', authMiddleware);
  app.use('/api/dashboard/*', authMiddleware);

  app.onError(errorHandler);
  app.notFound((c) => c.json({ error: 'Not Found' }, 404));

  return app;
}

export default createApp;


