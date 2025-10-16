import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';
import type { SystemHealth } from '../../types';

interface SystemHealthWidgetProps {
  title: string;
  health?: SystemHealth | null;
  value?: string | number;
  status?: 'healthy' | 'warning' | 'critical' | 'unknown';
  icon?: React.ReactNode;
  description?: string;
}

export function SystemHealthWidget({
  title,
  health,
  value,
  status,
  icon,
  description
}: SystemHealthWidgetProps) {
  const getStatus = () => {
    if (status) return status;
    if (health) return health.status;
    return 'unknown';
  };

  const getValue = () => {
    if (value !== undefined) return value;
    if (health) return health.status;
    return 'N/A';
  };

  const getDescription = () => {
    if (description) return description;
    if (health?.message) return health.message;
    return null;
  };

  const currentStatus = getStatus();
  const currentValue = getValue();
  const currentDescription = getDescription();

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    const config = {
      healthy: { label: 'Healthy', className: 'bg-green-100 text-green-800' },
      warning: { label: 'Warning', className: 'bg-yellow-100 text-yellow-800' },
      degraded: { label: 'Degraded', className: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
      unhealthy: { label: 'Unhealthy', className: 'bg-red-100 text-red-800' },
      unknown: { label: 'Unknown', className: 'bg-gray-100 text-gray-800' },
    };
    
    const statusConfig = config[currentStatus as keyof typeof config] || config.unknown;
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const getCardBorderClass = () => {
    switch (currentStatus) {
      case 'healthy':
        return 'border-green-200';
      case 'warning':
      case 'degraded':
        return 'border-yellow-200';
      case 'critical':
      case 'unhealthy':
        return 'border-red-200';
      default:
        return 'border-gray-200';
    }
  };

  return (
    <Card className={`${getCardBorderClass()} transition-colors`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {icon || getStatusIcon()}
            <h3 className="font-medium text-sm text-muted-foreground">{title}</h3>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="space-y-2">
          <div className="text-2xl font-bold">
            {typeof currentValue === 'string' && currentValue.length > 20
              ? `${currentValue.substring(0, 20)}...`
              : currentValue}
          </div>
          
          {currentDescription && (
            <p className="text-sm text-muted-foreground">
              {currentDescription.length > 60
                ? `${currentDescription.substring(0, 60)}...`
                : currentDescription}
            </p>
          )}
          
          {health?.timestamp && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(health.timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}