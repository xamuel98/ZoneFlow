import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { swaggerUI } from '@hono/swagger-ui';

// Routes
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import geofenceRoutes from './routes/geofences.js';
import locationRoutes from './routes/location.js';
import dashboardRoutes from './routes/dashboard.js';
import driverRoutes from './routes/drivers.js';
import monitoringRoutes from './routes/monitoring.js';
// import { queueDashboardRoutes } from './routes/queue-dashboard.js';

// Middleware
import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { versioningMiddleware } from './middleware/versioning.middleware.js';
import { requestLoggingMiddleware, errorLoggingMiddleware } from './services/logging.service.js';

// Services
import { cacheService } from './services/redis.service.js';

// OpenAPI Documentation
import { openAPIConfig } from './docs/openapi.js';

export type AppType = Hono<{ Variables: { user: import('./types/context.js').AuthUser } }>;

export function createApp(): AppType {
  const app = new Hono<{ Variables: { user: import('./types/context.js').AuthUser } }>();

  // Initialize services
  console.log('🔧 Initializing services...');
  
  // Initialize Redis cache service
  cacheService.get('startup_check').then(() => {
    console.log('✅ Redis cache service initialized');
  }).catch(() => {
    console.log('⚠️  Redis cache service not available, continuing without cache');
  });

  // Note: WebSocket and Queue services are initialized in index.ts

  // Global middleware
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

  // Logging middleware
  app.use('*', requestLoggingMiddleware());
  app.use('*', errorLoggingMiddleware());
  
  // Standard middleware
  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use('*', secureHeaders());

  // API versioning middleware
  app.use('/api/*', versioningMiddleware());

  // API Documentation
  if (process.env.ENABLE_API_DOCS === 'true') {
    app.get('/api/docs/openapi.json', (c) => c.json(openAPIConfig));
    app.get('/api/docs', swaggerUI({ url: '/api/docs/openapi.json' }));
    console.log('📚 API documentation available at /api/docs');
  }

  // Health check endpoint
  app.get('/health', (c) => c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(), 
    version: '1.0.0',
    services: {
      redis: 'available',
      websocket: 'available',
      queue: 'available'
    }
  }));

  // API Routes
  app.route('/api/v1/auth', authRoutes);
  app.route('/api/v1/orders', orderRoutes);
  app.route('/api/v1/geofences', geofenceRoutes);
  app.route('/api/v1/location', locationRoutes);
  app.route('/api/v1/dashboard', dashboardRoutes);
  app.route('/api/v1/drivers', driverRoutes);
  app.route('/api/v1/monitoring', monitoringRoutes);
  // app.route('/api', queueDashboardRoutes);

  // Backward compatibility (v1 as default)
  app.route('/api/auth', authRoutes);
  app.route('/api/orders', orderRoutes);
  app.route('/api/geofences', geofenceRoutes);
  app.route('/api/location', locationRoutes);
  app.route('/api/dashboard', dashboardRoutes);
  app.route('/api/drivers', driverRoutes);
  app.route('/api/monitoring', monitoringRoutes);

  // Protected routes middleware
  app.use('/api/*/orders/*', authMiddleware);
  app.use('/api/*/geofences/*', authMiddleware);
  app.use('/api/*/location/*', authMiddleware);
  app.use('/api/*/dashboard/*', authMiddleware);
  app.use('/api/*/drivers/*', authMiddleware);
  app.use('/api/*/monitoring/*', authMiddleware);

  // Backward compatibility protected routes
  app.use('/api/orders/*', authMiddleware);
  app.use('/api/geofences/*', authMiddleware);
  app.use('/api/location/*', authMiddleware);
  app.use('/api/dashboard/*', authMiddleware);
  app.use('/api/drivers/*', authMiddleware);

  // Error handling
  app.onError(errorHandler);
  app.notFound((c) => c.json({ error: 'Not Found' }, 404));

  console.log('🚀 ZoneFlow API application initialized with advanced features');
  
  return app;
}

export default createApp;


