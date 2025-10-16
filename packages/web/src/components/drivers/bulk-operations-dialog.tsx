import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Progress } from '../ui/progress';
import { 
  Users, 
  Trash2, 
  UserCheck, 
  UserX, 
  Activity,
  Download,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { driverService } from '../../services/driver-service';
import type { Driver, BulkDriverOperation, BulkOperationResult } from '../../types';

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDrivers: Driver[];
  onSuccess?: () => void;
}

type BulkOperationType = 'delete' | 'status' | 'export';

export function BulkOperationsDialog({
  open,
  onOpenChange,
  selectedDrivers,
  onSuccess,
}: BulkOperationsDialogProps) {
  const [operationType, setOperationType] = useState<BulkOperationType | null>(null);
  const [statusValue, setStatusValue] = useState<'available' | 'busy' | 'offline'>('available');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [progress, setProgress] = useState(0);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);

  const handleOperationSelect = (type: BulkOperationType) => {
    setOperationType(type);
    if (type === 'export') {
      handleExport();
    } else {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmOperation = async () => {
    if (!operationType) return;

    setIsLoading(true);
    setProgress(0);
    setShowConfirmDialog(false);

    try {
      let result: BulkOperationResult;
      const driverIds = selectedDrivers.map(d => d.id);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      switch (operationType) {
        case 'delete':
          result = await driverService.bulkDeleteDrivers(driverIds);
          break;
        case 'status':
          result = await driverService.bulkUpdateStatus(driverIds, statusValue);
          break;
        default:
          throw new Error('Invalid operation type');
      }

      clearInterval(progressInterval);
      setProgress(100);
      setOperationResult(result);

      if (result.errors.length === 0) {
        toast.success(`Successfully ${operationType === 'delete' ? 'deleted' : 'updated'} ${result.successful.length} drivers`);
      } else {
        toast.warning(`Operation completed with ${result.errors.length} errors`, {
          description: `${result.successful.length} drivers processed successfully`,
        });
      }

      onSuccess?.();
    } catch (error: any) {
      toast.error(`Failed to ${operationType} drivers`, {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setProgress(0);
        setOperationResult(null);
        setOperationType(null);
        onOpenChange(false);
      }, 2000);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      const blob = await driverService.exportDrivers('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drivers-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Drivers exported successfully');
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to export drivers', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationDescription = () => {
    switch (operationType) {
      case 'delete':
        return `This will permanently delete ${selectedDrivers.length} selected drivers. This action cannot be undone.`;
      case 'status':
        return `This will update the status of ${selectedDrivers.length} selected drivers to "${statusValue}".`;
      default:
        return '';
    }
  };

  const getOperationIcon = (type: BulkOperationType) => {
    switch (type) {
      case 'delete':
        return <Trash2 className="h-4 w-4" />;
      case 'status':
        return statusValue === 'available' ? <UserCheck className="h-4 w-4" /> : 
               statusValue === 'busy' ? <Activity className="h-4 w-4" /> : <UserX className="h-4 w-4" />;
      case 'export':
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bulk Operations
            </DialogTitle>
            <DialogDescription>
              Perform bulk operations on {selectedDrivers.length} selected drivers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Selected Drivers Summary */}
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Drivers ({selectedDrivers.length})</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedDrivers.map((driver) => (
                  <Badge key={driver.id} variant="secondary" className="text-xs">
                    {driver.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Operation Progress */}
            {isLoading && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {operationType === 'export' ? 'Exporting drivers...' : `Processing ${operationType} operation...`}
                  </span>
                </div>
                {operationType !== 'export' && <Progress value={progress} className="w-full" />}
              </div>
            )}

            {/* Operation Result */}
            {operationResult && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Operation Completed</span>
                </div>
                <div className="text-sm space-y-1">
                  <div className="text-green-600">✓ {operationResult.successful.length} drivers processed successfully</div>
                  {operationResult.errors.length > 0 && (
                    <div className="text-red-600">✗ {operationResult.errors.length} errors occurred</div>
                  )}
                </div>
              </div>
            )}

            {/* Operation Selection */}
            {!isLoading && !operationResult && (
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleOperationSelect('status')}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <div className="font-medium">Update Status</div>
                      <div className="text-sm text-muted-foreground">
                        Change the availability status of selected drivers
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4"
                  onClick={() => handleOperationSelect('export')}
                >
                  <div className="flex items-center gap-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <div className="font-medium">Export Drivers</div>
                      <div className="text-sm text-muted-foreground">
                        Download selected drivers data as CSV
                      </div>
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="justify-start h-auto p-4 text-red-600 hover:text-red-700"
                  onClick={() => handleOperationSelect('delete')}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">Delete Drivers</div>
                      <div className="text-sm text-muted-foreground">
                        Permanently remove selected drivers
                      </div>
                    </div>
                  </div>
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {operationType && getOperationIcon(operationType)}
              Confirm {operationType === 'delete' ? 'Deletion' : 'Status Update'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {getOperationDescription()}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {operationType === 'status' && (
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">New Status:</label>
              <Select value={statusValue} onValueChange={(value: 'available' | 'busy' | 'offline') => setStatusValue(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      Available
                    </div>
                  </SelectItem>
                  <SelectItem value="busy">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-yellow-600" />
                      Busy
                    </div>
                  </SelectItem>
                  <SelectItem value="offline">
                    <div className="flex items-center gap-2">
                      <UserX className="h-4 w-4 text-gray-600" />
                      Offline
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmOperation}
              className={operationType === 'delete' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {operationType === 'delete' ? 'Delete' : 'Update'} Drivers
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}