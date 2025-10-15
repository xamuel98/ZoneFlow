import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import DriverForm from './driver-form';
import { useDriverStore } from '../../stores/driver-store';
import type { Driver } from '@zoneflow/shared';

const EditDriverDialog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { updateDriver, isLoading } = useDriverStore();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoadingDriver, setIsLoadingDriver] = useState(true);

  const isOpen = location.pathname.startsWith('/drivers/edit/');

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/drivers');
    }
  };

  useEffect(() => {
    const fetchDriver = async () => {
      if (!id || !isOpen) return;
      
      setIsLoadingDriver(true);
      try {
        // Get driver from store first
        const { drivers } = useDriverStore.getState();
        const existingDriver = drivers.find(d => d.id === id);
        
        if (existingDriver) {
          setDriver(existingDriver);
        } else {
          // If not in store, navigate back
          navigate('/drivers');
          return;
        }
      } catch (error) {
        console.error('Failed to fetch driver:', error);
        navigate('/drivers');
      } finally {
        setIsLoadingDriver(false);
      }
    };

    fetchDriver();
  }, [id, isOpen, navigate]);

  const handleSubmit = async (data: Omit<Driver, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
    if (!id) return;
    
    try {
      await updateDriver(id, data);
      navigate('/drivers');
    } catch (error) {
      console.error('Failed to update driver:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Driver</DialogTitle>
        </DialogHeader>
        
        {isLoadingDriver ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        ) : driver ? (
          <DriverForm
            driver={driver}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            mode="edit"
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Driver not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditDriverDialog;