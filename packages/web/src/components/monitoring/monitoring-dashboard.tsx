import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  TrendingUp,
  Wifi,
  XCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { monitoringService } from '../../services/monitoring-service';
import { SystemHealthWidget } from './system-health-widget';
import { MetricsChart } from './metrics-chart';
import { AlertsList } from './alerts-list';
import { ServiceStatusGrid } from './service-status-grid';
import type {
  SystemHealth,
  SystemMetrics,
  PerformanceMetrics,
  MonitoringAlert,
  ServiceHealth
} from '../../types';

interface MonitoringDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export function MonitoringDashboard({ 
  autoRefresh = true, 
  refreshInterval = 30 
}: MonitoringDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('1h');
  const [dashboardData, setDashboardData] = useState<{
    health: SystemHealth | null;
    services: ServiceHealth[];
    metrics: SystemMetrics | null;
    performance: PerformanceMetrics | null;
    alerts: MonitoringAlert[];
  }>({
    health: null,
    services: [],
    metrics: null,
    performance: null,
    alerts: []
  });

  const fetchDashboardData = async () => {
    try {
      const data = await monitoringService.getDashboardData(timeRange);
      setDashboardData(data);
    } catch (error: any) {
      toast.error('Failed to fetch monitoring data', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    fetchDashboardData();
  };

  const handleTimeRangeChange = (newTimeRange: '1h' | '6h' | '24h' | '7d') => {
    setTimeRange(newTimeRange);
    setIsLoading(true);
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchDashboardData, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, timeRange]);

  // Real-time updates
  useEffect(() => {
    const unsubscribeMetrics = monitoringService.subscribeToMetrics((metrics) => {
      setDashboardData(prev => ({ ...prev, metrics }));
    });

    const unsubscribeAlerts = monitoringService.subscribeToAlerts((alert) => {
      setDashboardData(prev => ({
        ...prev,
        alerts: [alert, ...prev.alerts]
      }));
      
      // Show toast for new alerts
      if (alert.severity === 'critical' || alert.severity === 'high') {
        toast.error(`${alert.severity.toUpperCase()}: ${alert.title}`, {
          description: alert.description,
        });
      }
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
    };
  }, []);

  const getOverallStatus = () => {
    if (!dashboardData.health) return 'unknown';
    
    const criticalAlerts = dashboardData.alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = dashboardData.alerts.filter(a => a.severity === 'high').length;
    
    if (criticalAlerts > 0) return 'critical';
    if (highAlerts > 0 || dashboardData.health.status === 'degraded') return 'warning';
    if (dashboardData.health.status === 'healthy') return 'healthy';
    return 'unknown';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800' },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-800' },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.unknown;
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  if (isLoading && !dashboardData.health) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading monitoring data...</p>
          </div>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {getStatusIcon(overallStatus)}
            <h1 className="text-2xl font-bold">System Monitoring</h1>
          </div>
          {getStatusBadge(overallStatus)}
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemHealthWidget
          title="System Health"
          health={dashboardData.health}
          icon={<Server className="h-5 w-5" />}
        />
        <SystemHealthWidget
          title="Active Alerts"
          value={dashboardData.alerts.length}
          status={dashboardData.alerts.length > 0 ? 'warning' : 'healthy'}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <SystemHealthWidget
          title="Services"
          value={`${dashboardData.services.filter(s => s.status === 'healthy').length}/${dashboardData.services.length}`}
          status={dashboardData.services.every(s => s.status === 'healthy') ? 'healthy' : 'warning'}
          icon={<Zap className="h-5 w-5" />}
        />
        <SystemHealthWidget
          title="Uptime"
          value={dashboardData.health?.uptime ? `${(dashboardData.health.uptime * 100).toFixed(2)}%` : 'N/A'}
          status={dashboardData.health?.uptime && dashboardData.health.uptime > 0.99 ? 'healthy' : 'warning'}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart
              data={dashboardData.metrics}
              type="resources"
              timeRange={timeRange}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsChart
              data={dashboardData.performance}
              type="performance"
              timeRange={timeRange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Service Status and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Service Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ServiceStatusGrid services={dashboardData.services} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsList
              alerts={dashboardData.alerts.slice(0, 10)}
              onAcknowledge={(alertId) => monitoringService.acknowledgeAlert(alertId)}
              onResolve={(alertId, resolution) => monitoringService.resolveAlert(alertId, resolution)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      {dashboardData.metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Detailed System Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">CPU Usage</span>
                </div>
                <div className="text-2xl font-bold">
                  {dashboardData.metrics.cpu?.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${dashboardData.metrics.cpu}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Memory Usage</span>
                </div>
                <div className="text-2xl font-bold">
                  {dashboardData.metrics.memory?.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${dashboardData.metrics.memory}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Disk Usage</span>
                </div>
                <div className="text-2xl font-bold">
                  {dashboardData.metrics.disk?.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${dashboardData.metrics.disk}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}