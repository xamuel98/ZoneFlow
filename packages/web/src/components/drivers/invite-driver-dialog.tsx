import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { driverInvitationService } from '../../services/driver-invitation.service';
import { CreateDriverInvitationRequest } from '../../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

const inviteDriverSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(1, 'Please enter the driver\'s name'),
  phone: z.string().optional(),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
  message: z.string().optional(),
  expiresInDays: z.coerce.number().min(1).max(365).default(7),
});

type InviteDriverFormData = z.infer<typeof inviteDriverSchema>;

interface InviteDriverDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'van', label: 'Van' },
  { value: 'truck', label: 'Truck' },
];

export function InviteDriverDialog({
  open = false,
  onOpenChange,
  onSuccess,
}: InviteDriverDialogProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(false);

  const isOpen = searchParams.get('invite') === 'true';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate('/drivers');
    }
  };

  const form = useForm<InviteDriverFormData>({
    resolver: zodResolver(inviteDriverSchema as any),
    defaultValues: {
      email: '',
      name: '',
      phone: '',
      vehicleType: '',
      licensePlate: '',
      message: '',
      expiresInDays: 7,
    },
  });

  const onSubmit = async (data: InviteDriverFormData) => {
    try {
      setIsLoading(true);
      
      // Transform data to match API expectations
      const invitationData: CreateDriverInvitationRequest = {
        email: data.email,
        name: data.name,
        phone: data.phone || undefined,
        vehicleType: data.vehicleType || undefined,
        licensePlate: data.licensePlate || undefined,
        message: data.message || undefined,
        expiresInDays: data.expiresInDays,
      };
      
      await driverInvitationService.createInvitation(invitationData);
      
      toast.success('Invitation sent successfully!', {
        description: `Invitation sent to ${data.email}`,
      });
      
      form.reset();
      handleOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to send invitation:', error);
      toast.error('Failed to send invitation', {
        description: 'Please try again later',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New Driver</DialogTitle>
          <DialogDescription>
            Send an invitation to a new driver to join your team. They will receive an email with instructions to create their account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Personal Information</h4>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="driver@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The driver will receive an invitation at this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The driver's full name for identification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional contact number for the driver.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Vehicle Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Vehicle Information</h4>
              
              <FormField
                control={form.control}
                name="vehicleType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional vehicle type for delivery assignments.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licensePlate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Plate</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional license plate number for vehicle identification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Invitation Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Invitation Settings</h4>
              
              <FormField
                control={form.control}
                name="expiresInDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invitation Expires In (Days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                      />
                    </FormControl>
                    <FormDescription>
                      The invitation will expire after this many days (1-365, default: 7).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Welcome to our team! We're excited to have you join us..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional personal message to include in the invitation email.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}