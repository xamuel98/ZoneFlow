import pino from 'pino';
import { cacheService } from './redis.service.js';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'zoneflow-api',
    version: process.env.npm_package_version || '1.0.0'
  }
});

// Metrics collection
export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, any> = new Map();

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  // Request metrics
  async recordRequest(method: string, path: string, statusCode: number, duration: number) {
    const key = `request:${method}:${path}`;
    const timestamp = Date.now();
    
    // Increment request counter
    await cacheService.increment(`metrics:requests:total`, 86400);
    await cacheService.increment(`metrics:requests:${method}`, 86400);
    await cacheService.increment(`metrics:requests:status:${statusCode}`, 86400);
    
    // Record response time
    await cacheService.setHash(`metrics:response_times`, key, JSON.stringify({
      duration,
      timestamp,
      statusCode
    }));
    
    // Log request
    logger.info({
      type: 'request',
      method,
      path,
      statusCode,
      duration,
      timestamp
    }, `${method} ${path} - ${statusCode} (${duration}ms)`);
  }

  // Error metrics
  async recordError(error: Error, context?: any) {
    const timestamp = Date.now();
    const errorKey = `error:${error.name}:${timestamp}`;
    
    await cacheService.increment('metrics:errors:total', 86400);
    await cacheService.increment(`metrics:errors:${error.name}`, 86400);
    
    await cacheService.set(errorKey, JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp
    }), 3600);
    
    logger.error({
      type: 'error',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp
    }, `Error: ${error.message}`);
  }

  // Business metrics
  async recordDriverMetric(driverId: string, metric: string, value: number) {
    const key = `metrics:driver:${driverId}:${metric}`;
    await cacheService.increment(key, 86400);
    
    logger.info({
      type: 'driver_metric',
      driverId,
      metric,
      value,
      timestamp: Date.now()
    }, `Driver metric: ${metric} = ${value}`);
  }

  async recordOrderMetric(orderId: string, metric: string, value: any) {
    const key = `metrics:order:${orderId}:${metric}`;
    await cacheService.set(key, JSON.stringify(value), 86400);
    
    logger.info({
      type: 'order_metric',
      orderId,
      metric,
      value,
      timestamp: Date.now()
    }, `Order metric: ${metric}`);
  }

  // System metrics
  async recordSystemMetric(metric: string, value: number) {
    const key = `metrics:system:${metric}`;
    await cacheService.set(key, value.toString(), 300); // 5 min TTL
    
    logger.info({
      type: 'system_metric',
      metric,
      value,
      timestamp: Date.now()
    }, `System metric: ${metric} = ${value}`);
  }

  // Get metrics
  async getMetrics(timeframe: 'hour' | 'day' | 'week' = 'day') {
    const ttl = timeframe === 'hour' ? 3600 : timeframe === 'day' ? 86400 : 604800;
    
    const [
      totalRequests,
      totalErrors,
      getRequests,
      postRequests,
      putRequests,
      deleteRequests,
      status200,
      status400,
      status500
    ] = await Promise.all([
      cacheService.get('metrics:requests:total'),
      cacheService.get('metrics:errors:total'),
      cacheService.get('metrics:requests:GET'),
      cacheService.get('metrics:requests:POST'),
      cacheService.get('metrics:requests:PUT'),
      cacheService.get('metrics:requests:DELETE'),
      cacheService.get('metrics:requests:status:200'),
      cacheService.get('metrics:requests:status:400'),
      cacheService.get('metrics:requests:status:500')
    ]);

    return {
      requests: {
        total: parseInt(totalRequests || '0'),
        byMethod: {
          GET: parseInt(getRequests || '0'),
          POST: parseInt(postRequests || '0'),
          PUT: parseInt(putRequests || '0'),
          DELETE: parseInt(deleteRequests || '0')
        },
        byStatus: {
          '200': parseInt(status200 || '0'),
          '400': parseInt(status400 || '0'),
          '500': parseInt(status500 || '0')
        }
      },
      errors: {
        total: parseInt(totalErrors || '0')
      },
      timeframe,
      timestamp: Date.now()
    };
  }

  // Health check metrics
  async getHealthMetrics() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const metrics = {
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external
      },
      uptime,
      timestamp: Date.now(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Cache health metrics
    await cacheService.set('metrics:health', JSON.stringify(metrics), 60);
    
    return metrics;
  }
}

// Request logging middleware
export const requestLoggingMiddleware = () => {
  const metricsService = MetricsService.getInstance();
  
  return async (c: any, next: any) => {
    const start = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    
    // Add request ID for tracing
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    c.set('requestId', requestId);
    
    logger.info({
      type: 'request_start',
      requestId,
      method,
      path,
      userAgent: c.req.header('user-agent'),
      ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    }, `Request started: ${method} ${path}`);
    
    await next();
    
    const duration = Date.now() - start;
    const statusCode = c.res.status;
    
    // Record metrics
    await metricsService.recordRequest(method, path, statusCode, duration);
    
    logger.info({
      type: 'request_end',
      requestId,
      method,
      path,
      statusCode,
      duration
    }, `Request completed: ${method} ${path} - ${statusCode} (${duration}ms)`);
  };
};

// Error logging middleware
export const errorLoggingMiddleware = () => {
  const metricsService = MetricsService.getInstance();
  
  return async (c: any, next: any) => {
    try {
      await next();
    } catch (error) {
      const requestId = c.get('requestId');
      
      await metricsService.recordError(error as Error, {
        requestId,
        method: c.req.method,
        path: c.req.path,
        userAgent: c.req.header('user-agent')
      });
      
      throw error;
    }
  };
};

export const metricsService = MetricsService.getInstance();