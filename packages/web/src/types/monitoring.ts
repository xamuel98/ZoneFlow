// Monitoring Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  uptime: number;
  version: string;
  timestamp: string;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  lastCheck: string;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  requests: {
    total: number;
    rate: number;
    errors: number;
    errorRate: number;
  };
  database: {
    connections: number;
    queries: number;
    avgResponseTime: number;
  };
  timestamp: string;
}

export interface PerformanceMetrics {
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
  errors: {
    count: number;
    rate: number;
    types: Record<string, number>;
  };
  timestamp: string;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

export interface MonitoringAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  service: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
}

export type HealthStatus = SystemHealth['status'];
export type ServiceStatus = ServiceHealth['status'];