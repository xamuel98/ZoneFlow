import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Info,
  XCircle,
  Eye,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { MonitoringAlert } from '../../types';

interface AlertsListProps {
  alerts: MonitoringAlert[];
  onAcknowledge: (alertId: string) => Promise<void>;
  onResolve: (alertId: string, resolution: string) => Promise<void>;
  showActions?: boolean;
}

export function AlertsList({ 
  alerts, 
  onAcknowledge, 
  onResolve, 
  showActions = true 
}: AlertsListProps) {
  const [selectedAlert, setSelectedAlert] = useState<MonitoringAlert | null>(null);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [resolution, setResolution] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const config = {
      critical: { label: 'Critical', className: 'bg-red-100 text-red-800' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: 'Low', className: 'bg-blue-100 text-blue-800' },
    };
    
    const severityConfig = config[severity as keyof typeof config] || config.low;
    return (
      <Badge className={severityConfig.className}>
        {severityConfig.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: { label: 'Active', className: 'bg-red-100 text-red-800' },
      acknowledged: { label: 'Acknowledged', className: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: 'Resolved', className: 'bg-green-100 text-green-800' },
    };
    
    const statusConfig = config[status as keyof typeof config] || config.active;
    return (
      <Badge className={statusConfig.className}>
        {statusConfig.label}
      </Badge>
    );
  };

  const handleAcknowledge = async (alert: MonitoringAlert) => {
    if (alert.status !== 'active') return;
    
    setIsLoading(alert.id);
    try {
      await onAcknowledge(alert.id);
      toast.success('Alert acknowledged');
    } catch (error: any) {
      toast.error('Failed to acknowledge alert', {
        description: error.message,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedAlert || !resolution.trim()) return;
    
    setIsLoading(selectedAlert.id);
    try {
      await onResolve(selectedAlert.id, resolution);
      toast.success('Alert resolved');
      setShowResolveDialog(false);
      setSelectedAlert(null);
      setResolution('');
    } catch (error: any) {
      toast.error('Failed to resolve alert', {
        description: error.message,
      });
    } finally {
      setIsLoading(null);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <p className="text-muted-foreground">No alerts at this time</p>
        <p className="text-sm text-muted-foreground">All systems are running normally</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <Card key={alert.id} className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(alert.severity)}
                    <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {alert.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(alert.timestamp)}
                    </div>
                    {alert.source && (
                      <span>Source: {alert.source}</span>
                    )}
                  </div>
                </div>
                
                {showActions && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {alert.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert)}
                        disabled={isLoading === alert.id}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Acknowledge
                      </Button>
                    )}
                    
                    {alert.status === 'acknowledged' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAlert(alert);
                          setShowResolveDialog(true);
                        }}
                        disabled={isLoading === alert.id}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert Details Dialog */}
      <Dialog open={!!selectedAlert && !showResolveDialog} onOpenChange={() => setSelectedAlert(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && getSeverityIcon(selectedAlert.severity)}
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>
              Alert details and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getSeverityBadge(selectedAlert.severity)}
                {getStatusBadge(selectedAlert.status)}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedAlert.description}
                </p>
              </div>
              
              {selectedAlert.details && (
                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Source:</span>
                  <p className="text-muted-foreground">{selectedAlert.source || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium">Timestamp:</span>
                  <p className="text-muted-foreground">
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              
              {selectedAlert.resolution && (
                <div>
                  <h4 className="font-medium mb-2">Resolution</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAlert.resolution}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolve Alert Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Provide a resolution description for this alert.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Resolution Notes</label>
              <Textarea
                placeholder="Describe how this alert was resolved..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResolveDialog(false);
                setResolution('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution.trim() || isLoading === selectedAlert?.id}
            >
              Resolve Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}