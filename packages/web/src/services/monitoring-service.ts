import { apiService } from './api';
import type {
  SystemHealth,
  SystemMetrics,
  PerformanceMetrics,
  MonitoringAlert,
  ServiceHealth
} from '../types';

class MonitoringService {
  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiService.get<SystemHealth>('/monitoring/health');
  }

  /**
   * Get health status for specific services
   */
  async getServiceHealth(serviceName?: string): Promise<ServiceHealth[]> {
    const params = serviceName ? { service: serviceName } : {};
    return apiService.get<ServiceHealth[]>('/monitoring/services', { params });
  }

  /**
   * Get system metrics (CPU, memory, disk usage)
   */
  async getSystemMetrics(timeRange: '1h' | '6h' | '24h' | '7d' = '1h'): Promise<SystemMetrics> {
    return apiService.get<SystemMetrics>('/monitoring/metrics', {
      params: { timeRange }
    });
  }

  /**
   * Get performance metrics (response times, throughput)
   */
  async getPerformanceMetrics(timeRange: '1h' | '6h' | '24h' | '7d' = '1h'): Promise<PerformanceMetrics> {
    return apiService.get<PerformanceMetrics>('/monitoring/performance', {
      params: { timeRange }
    });
  }

  /**
   * Get active monitoring alerts
   */
  async getAlerts(severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<MonitoringAlert[]> {
    const params = severity ? { severity } : {};
    return apiService.get<MonitoringAlert[]>('/monitoring/alerts', { params });
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    return apiService.patch(`/monitoring/alerts/${alertId}/acknowledge`);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, resolution?: string): Promise<void> {
    return apiService.patch(`/monitoring/alerts/${alertId}/resolve`, {
      resolution
    });
  }

  /**
   * Get monitoring dashboard data (combined metrics)
   */
  async getDashboardData(timeRange: '1h' | '6h' | '24h' | '7d' = '1h'): Promise<{
    health: SystemHealth;
    services: ServiceHealth[];
    metrics: SystemMetrics;
    performance: PerformanceMetrics;
    alerts: MonitoringAlert[];
  }> {
    const [health, services, metrics, performance, alerts] = await Promise.all([
      this.getSystemHealth(),
      this.getServiceHealth(),
      this.getSystemMetrics(timeRange),
      this.getPerformanceMetrics(timeRange),
      this.getAlerts()
    ]);

    return {
      health,
      services,
      metrics,
      performance,
      alerts
    };
  }

  /**
   * Test endpoint connectivity
   */
  async testEndpoint(url: string): Promise<{
    status: 'success' | 'error';
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    return apiService.post('/monitoring/test-endpoint', { url });
  }

  /**
   * Get uptime statistics
   */
  async getUptimeStats(timeRange: '24h' | '7d' | '30d' = '24h'): Promise<{
    uptime: number;
    downtime: number;
    incidents: number;
    availability: number;
  }> {
    return apiService.get('/monitoring/uptime', {
      params: { timeRange }
    });
  }

  /**
   * Get real-time metrics stream (WebSocket)
   */
  subscribeToMetrics(callback: (data: SystemMetrics) => void): () => void {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';
    const ws = new WebSocket(`${wsUrl}/monitoring/metrics`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }

  /**
   * Subscribe to real-time alerts
   */
  subscribeToAlerts(callback: (alert: MonitoringAlert) => void): () => void {
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';
    const ws = new WebSocket(`${wsUrl}/monitoring/alerts`);

    ws.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data);
        callback(alert);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Return cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }
}

export const monitoringService = new MonitoringService();