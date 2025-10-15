import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Checkbox } from '../ui/checkbox';
import type { Driver } from '@zoneflow/shared';

// Updated validation schema to match backend CreateDriverData
const driverFormSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email address')
    .min(1, 'Email is required'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number format'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .optional()
    .or(z.literal('')),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

type DriverFormData = z.infer<typeof driverFormSchema>;

interface DriverFormProps {
  driver?: Driver;
  onSubmit: (data: any) => Promise<void>;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const DriverForm = ({ 
  driver, 
  onSubmit, 
  isLoading = false,
  mode
}: DriverFormProps) => {
  const isUpdateMode = mode === 'edit';
  
  const form = useForm({
    resolver: zodResolver(driverFormSchema),
    defaultValues: {
      name: driver?.name || '',
      email: driver?.email || '',
      phone: driver?.phone || '',
      password: '',
      vehicleType: driver?.vehicle_type || '',
      licensePlate: driver?.license_plate || '',
      isAvailable: driver?.is_available ?? true,
    },
  });

  const handleSubmit = async (data: DriverFormData) => {
    try {
      // Remove empty password for updates
      const submitData = { ...data };
      if (isUpdateMode && !submitData.password) {
        delete submitData.password;
      }
      
      await onSubmit(submitData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter driver's full name" 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address *</FormLabel>
              <FormControl>
                <Input 
                  type="email"
                  placeholder="Enter email address" 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone Field */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter phone number" 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password {isUpdateMode ? '(leave blank to keep current)' : '*'}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password"
                  placeholder={isUpdateMode ? "Enter new password (optional)" : "Enter password"} 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vehicle Type Field */}
        <FormField
          control={form.control}
          name="vehicleType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vehicle Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* License Plate Field */}
        <FormField
          control={form.control}
          name="licensePlate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Plate</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter license plate number" 
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Available Status Field */}
        <FormField
          control={form.control}
          name="isAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Available for assignments
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Driver is available to receive new delivery assignments
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isUpdateMode ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              isUpdateMode ? 'Update Driver' : 'Create Driver'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DriverForm;