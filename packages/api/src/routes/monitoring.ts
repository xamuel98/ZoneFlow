import { Hono } from 'hono';
import { metricsService, logger } from '../services/logging.service.js';
import { cacheService } from '../services/redis.service.js';
import { authMiddleware } from '../middleware/auth.js';

const monitoring = new Hono<{ Variables: { user: import('../types/context.js').AuthUser } }>();

// Health check endpoint (public)
monitoring.get('/health', async (c) => {
  try {
    const healthMetrics = await metricsService.getHealthMetrics();
    
    // Test Redis connection
    const redisHealth = await cacheService.get('health_check') !== null;
    await cacheService.set('health_check', 'ok', 60);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: healthMetrics.memory,
      redis: redisHealth ? 'connected' : 'disconnected',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
    
    logger.info({ type: 'health_check', health }, 'Health check performed');
    
    return c.json(health);
  } catch (error) {
    logger.error({ type: 'health_check_error', error }, 'Health check failed');
    
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// Readiness check
monitoring.get('/ready', async (c) => {
  try {
    // Check if all critical services are ready
    const redisReady = await cacheService.exists('health_check');
    
    if (!redisReady) {
      return c.json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        services: {
          redis: 'not_ready'
        }
      }, 503);
    }
    
    return c.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'ready'
      }
    });
  } catch (error) {
    return c.json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 503);
  }
});

// Liveness check
monitoring.get('/live', async (c) => {
  return c.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Metrics endpoint (protected)
monitoring.get('/metrics', authMiddleware, async (c) => {
  try {
    const timeframe = c.req.query('timeframe') as 'hour' | 'day' | 'week' || 'day';
    const metrics = await metricsService.getMetrics(timeframe);
    
    logger.info({ type: 'metrics_request', timeframe }, 'Metrics requested');
    
    return c.json(metrics);
  } catch (error) {
    logger.error({ type: 'metrics_error', error }, 'Failed to get metrics');
    
    return c.json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// System metrics endpoint (protected)
monitoring.get('/metrics/system', authMiddleware, async (c) => {
  try {
    const systemMetrics = await metricsService.getHealthMetrics();
    
    // Additional system metrics
    const additionalMetrics = {
      ...systemMetrics,
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0],
      cpuUsage: process.cpuUsage(),
      resourceUsage: process.resourceUsage ? process.resourceUsage() : null
    };
    
    return c.json(additionalMetrics);
  } catch (error) {
    logger.error({ type: 'system_metrics_error', error }, 'Failed to get system metrics');
    
    return c.json({
      error: 'Failed to retrieve system metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Application metrics endpoint (protected)
monitoring.get('/metrics/app', authMiddleware, async (c) => {
  try {
    const [
      driverCount,
      orderCount,
      activeConnections
    ] = await Promise.all([
      cacheService.get('metrics:drivers:total'),
      cacheService.get('metrics:orders:total'),
      cacheService.get('metrics:websocket:connections')
    ]);
    
    const appMetrics = {
      drivers: {
        total: parseInt(driverCount || '0'),
        active: parseInt(await cacheService.get('metrics:drivers:active') || '0')
      },
      orders: {
        total: parseInt(orderCount || '0'),
        pending: parseInt(await cacheService.get('metrics:orders:pending') || '0'),
        completed: parseInt(await cacheService.get('metrics:orders:completed') || '0')
      },
      websocket: {
        activeConnections: parseInt(activeConnections || '0')
      },
      timestamp: new Date().toISOString()
    };
    
    return c.json(appMetrics);
  } catch (error) {
    logger.error({ type: 'app_metrics_error', error }, 'Failed to get app metrics');
    
    return c.json({
      error: 'Failed to retrieve application metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Logs endpoint (protected, admin only)
monitoring.get('/logs', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    const level = c.req.query('level') || 'info';
    const limit = parseInt(c.req.query('limit') || '100');
    const since = c.req.query('since'); // ISO timestamp
    
    // This is a simplified implementation
    // In production, you'd want to use a proper log aggregation service
    const logs = {
      level,
      limit,
      since,
      logs: [], // Would fetch from log storage
      timestamp: new Date().toISOString(),
      message: 'Log aggregation not implemented. Use external log management service.'
    };
    
    return c.json(logs);
  } catch (error) {
    logger.error({ type: 'logs_error', error }, 'Failed to get logs');
    
    return c.json({
      error: 'Failed to retrieve logs',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

// Performance metrics
monitoring.get('/metrics/performance', authMiddleware, async (c) => {
  try {
    const responseTimeData = await cacheService.getAllHash('metrics:response_times');
    
    const responseTimes = Object.values(responseTimeData || {})
      .map(data => {
        try {
          return JSON.parse(data as string);
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 1000); // Last 1000 requests
    
    const durations = responseTimes.map(rt => rt.duration);
    const avgResponseTime = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
    
    const p95ResponseTime = durations.length > 0
      ? durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
      : 0;
    
    const performance = {
      responseTime: {
        average: Math.round(avgResponseTime * 100) / 100,
        p95: p95ResponseTime,
        samples: durations.length
      },
      requests: {
        total: responseTimes.length,
        timeframe: 'last_1000_requests'
      },
      timestamp: new Date().toISOString()
    };
    
    return c.json(performance);
  } catch (error) {
    logger.error({ type: 'performance_metrics_error', error }, 'Failed to get performance metrics');
    
    return c.json({
      error: 'Failed to retrieve performance metrics',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default monitoring;