import { z } from 'zod';
import { ValidationError } from '../types/services.js';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['business_owner', 'driver'], {
    errorMap: () => ({ message: 'Role must be business_owner or driver' })
  }),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Order validation schemas
export const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters'),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  pickupAddress: z.string().min(5, 'Pickup address is required'),
  pickupLatitude: z.number().min(-90).max(90, 'Invalid pickup latitude'),
  pickupLongitude: z.number().min(-180).max(180, 'Invalid pickup longitude'),
  deliveryAddress: z.string().min(5, 'Delivery address is required'),
  deliveryLatitude: z.number().min(-90).max(90, 'Invalid delivery latitude'),
  deliveryLongitude: z.number().min(-180).max(180, 'Invalid delivery longitude'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled']),
  notes: z.string().optional(),
});

// Geofence validation schemas
export const createGeofenceSchema = z.object({
  name: z.string().min(2, 'Geofence name must be at least 2 characters'),
  type: z.enum(['pickup', 'delivery', 'restricted', 'custom']),
  centerLatitude: z.number().min(-90).max(90, 'Invalid center latitude'),
  centerLongitude: z.number().min(-180).max(180, 'Invalid center longitude'),
  radius: z.number().min(10).max(10000, 'Radius must be between 10 and 10000 meters'),
});

// Location validation schemas
export const updateLocationSchema = z.object({
  latitude: z.number().min(-90).max(90, 'Invalid latitude'),
  longitude: z.number().min(-180).max(180, 'Invalid longitude'),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional(),
  orderId: z.string().optional(),
});

// Business validation schemas
export const createBusinessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

// Driver validation schemas
export const createDriverSchema = z.object({
  name: z.string().min(2, 'Driver name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  vehicleType: z.string().optional(),
  licensePlate: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

export const bulkCreateDriverSchema = z.object({
  drivers: z.array(createDriverSchema).min(1, 'At least one driver is required'),
});

// Validation helper function
export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      throw new ValidationError(`Validation failed: ${message}`);
    }
    throw error;
  }
};

// Driver update schema (exclude password updates via this route)
export const updateDriverSchema = createDriverSchema.omit({ password: true }).partial();

// Geofence update schema (partial)
export const updateGeofenceSchema = createGeofenceSchema.partial();

// Accept invite schema
export const acceptInviteSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

// Orders list filter schema
export const orderListFilterSchema = z.object({
  status: z.enum(['pending','assigned','picked_up','in_transit','delivered','cancelled']).optional(),
  priority: z.enum(['low','medium','high','urgent']).optional(),
  driverId: z.string().optional(),
});