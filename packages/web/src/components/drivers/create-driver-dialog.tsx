import { useNavigate, useLocation } from 'react-router-dom';
import { useDriverStore } from '../../stores/driver-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import DriverForm from './driver-form';

const CreateDriverDialog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createDriver, isLoading } = useDriverStore();

  const isOpen = location.pathname === '/drivers/create';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/drivers');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      await createDriver(data);
      navigate('/drivers');
    } catch (error) {
      // Error handling is done in the store
      console.error('Failed to create driver:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Driver</DialogTitle>
        </DialogHeader>
        <DriverForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateDriverDialog;