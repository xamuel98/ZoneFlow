import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Activity,
  Database,
  Server,
  Wifi,
  Zap,
  Globe
} from 'lucide-react';
import type { ServiceHealth } from '../../types';

interface ServiceStatusGridProps {
  services: ServiceHealth[];
  onServiceClick?: (service: ServiceHealth) => void;
}

export function ServiceStatusGrid({ services, onServiceClick }: ServiceStatusGridProps) {
  const getServiceIcon = (serviceName: string) => {
    const name = serviceName.toLowerCase();
    if (name.includes('database') || name.includes('db')) {
      return <Database className="h-5 w-5" />;
    }
    if (name.includes('api') || name.includes('backend')) {
      return <Server className="h-5 w-5" />;
    }
    if (name.includes('web') || name.includes('frontend')) {
      return <Globe className="h-5 w-5" />;
    }
    if (name.includes('cache') || name.includes('redis')) {
      return <Zap className="h-5 w-5" />;
    }
    if (name.includes('network') || name.includes('proxy')) {
      return <Wifi className="h-5 w-5" />;
    }
    return <Activity className="h-5 w-5" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800' },
      degraded: { label: 'Degraded', className: 'bg-yellow-100 text-yellow-800' },
      unhealthy: { label: 'Unhealthy', className: 'bg-red-100 text-red-800' },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-800' },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.unknown;
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getCardBorderClass = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 hover:border-green-300';
      case 'degraded':
        return 'border-yellow-200 hover:border-yellow-300';
      case 'unhealthy':
        return 'border-red-200 hover:border-red-300';
      default:
        return 'border-gray-200 hover:border-gray-300';
    }
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime) return 'N/A';
    return `${responseTime.toFixed(0)}ms`;
  };

  const formatUptime = (uptime?: number) => {
    if (!uptime) return 'N/A';
    return `${(uptime * 100).toFixed(2)}%`;
  };

  const formatLastCheck = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-8">
        <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-muted-foreground">No services configured</p>
        <p className="text-sm text-muted-foreground">Add services to monitor their health</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => (
        <Card
          key={service.name}
          className={`${getCardBorderClass(service.status)} transition-all cursor-pointer hover:shadow-md`}
          onClick={() => onServiceClick?.(service)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getServiceIcon(service.name)}
                <h3 className="font-medium text-sm">{service.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                {getStatusBadge(service.status)}
              </div>
            </div>

            {service.description && (
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {service.description}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Response Time:</span>
                <span className="font-medium">{formatResponseTime(service.responseTime)}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Uptime:</span>
                <span className="font-medium">{formatUptime(service.uptime)}</span>
              </div>
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Last Check:</span>
                <span className="font-medium flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatLastCheck(service.lastCheck)}
                </span>
              </div>
            </div>

            {service.endpoint && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Endpoint:</span>
                  <span className="font-mono text-xs truncate max-w-32" title={service.endpoint}>
                    {service.endpoint}
                  </span>
                </div>
              </div>
            )}

            {service.message && service.status !== 'healthy' && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-red-600 line-clamp-2">
                  {service.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}