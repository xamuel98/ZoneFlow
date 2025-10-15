// Service types and interfaces for better type safety

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Order Service Types
export interface OrderFilters {
  status?: string;
  priority?: string;
  driverId?: string;
}

export interface CreateOrderData {
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  priority: 'low' | 'medium' | 'high';
  estimatedDelivery?: string;
  notes?: string;
}

export interface UpdateOrderStatusData {
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  notes?: string;
}

export interface OrderWithDriver {
  id: string;
  tracking_code: string;
  business_id: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  status: string;
  priority: string;
  estimated_delivery?: string;
  actual_pickup?: string;
  actual_delivery?: string;
  notes?: string;
  driver_id?: string;
  driver_user_id?: string;
  driver_name?: string;
  driver_phone?: string;
  created_at: string;
  updated_at: string;
}

// Location Service Types
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export interface LocationHistory {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

// Dashboard Service Types
export interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  avgDeliveryTime: number;
  orderMetrics: {
    pending: number;
    assigned: number;
    picked_up: number;
    in_transit: number;
    delivered: number;
    cancelled: number;
  };
  deliveryMetrics: {
    onTime: number;
    delayed: number;
    avgDelayMinutes: number;
  };
  topDrivers: Array<{
    id: string;
    name: string;
    completedOrders: number;
    avgRating?: number;
  }>;
}

export interface ActivityItem {
  type: 'order' | 'geofence';
  id: string;
  timestamp: string;
  [key: string]: any;
}

export interface MapData {
  activeOrders: Array<{
    id: string;
    tracking_code: string;
    status: string;
    priority: string;
    customer_name: string;
    pickup_latitude: number;
    pickup_longitude: number;
    pickup_address: string;
    delivery_latitude: number;
    delivery_longitude: number;
    delivery_address: string;
    estimated_delivery?: string;
    driver_id?: string;
    driver_latitude?: number;
    driver_longitude?: number;
    driver_name?: string;
  }>;
  drivers: Array<{
    id: string;
    name: string;
    phone: string;
    current_latitude?: number;
    current_longitude?: number;
    last_location_update?: string;
    is_available: boolean;
    vehicle_type: string;
    license_plate: string;
  }>;
  geofences: Array<{
    id: string;
    name: string;
    type: string;
    center_latitude: number;
    center_longitude: number;
    radius: number;
  }>;
}

export interface DriverPerformance {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  is_available: boolean;
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  avg_delay_minutes?: number;
  avg_delivery_time_minutes?: number;
}

// Driver Service Types
export interface CreateDriverData {
  name: string;
  email: string;
  phone: string;
  password?: string;
  vehicleType?: string;
  licensePlate?: string;
  isAvailable?: boolean;
}

export interface BulkCreateDriverData {
  drivers: CreateDriverData[];
}

export interface DriverImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  successfulDrivers: Array<{
    id: string;
    name: string;
    email: string;
  }>;
}

export interface DriverWithUser {
  id: string;
  user_id: string;
  business_id: string;
  vehicle_type?: string;
  license_plate?: string;
  is_available: boolean;
  current_latitude?: number;
  current_longitude?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

// Geofence Service Types
export interface CreateGeofenceData {
  name: string;
  type: 'pickup' | 'delivery' | 'restricted' | 'custom';
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  isActive?: boolean;
}

export interface UpdateGeofenceData {
  name?: string;
  type?: 'pickup' | 'delivery' | 'restricted' | 'custom';
  centerLatitude?: number;
  centerLongitude?: number;
  radius?: number;
  isActive?: boolean;
}

export interface GeofenceWithEvents {
  id: string;
  name: string;
  type: string;
  center_latitude: number;
  center_longitude: number;
  radius: number;
  is_active: boolean;
  business_id: string;
  created_at: string;
  updated_at: string;
  events?: Array<{
    id: string;
    event_type: string;
    timestamp: string;
    driver_name: string;
    order_tracking_code?: string;
  }>;
}

// Auth Service Types
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'business_owner' | 'admin' | 'driver';
  businessName?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    businessId?: string;
  };
  token: string;
}

// Service Error Types
export class ServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}