// Core entity types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'business_owner' | 'dispatcher' | 'driver';
  business_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  user_id: string;
  business_id: string;
  vehicle_info?: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  business_id: string;
  tracking_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  delivery_address: string;
  delivery_lat: number;
  delivery_lng: number;
  driver_id?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_delivery?: string;
  actual_delivery?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Geofence {
  id: string;
  business_id: string;
  name: string;
  type: 'circle' | 'polygon';
  center_lat?: number;
  center_lng?: number;
  radius?: number;
  coordinates?: Array<[number, number]>;
  triggers: GeofenceTrigger[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GeofenceTrigger {
  id: string;
  event_type: 'enter' | 'exit' | 'dwell';
  action_type: 'webhook' | 'notification' | 'status_update';
  action_config: Record<string, any>;
  dwell_time?: number; // in seconds
}

export interface LocationHistory {
  id: string;
  driver_id: string;
  order_id?: string;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface GeofenceEvent {
  id: string;
  geofence_id: string;
  driver_id: string;
  order_id?: string;
  event_type: 'enter' | 'exit' | 'dwell';
  lat: number;
  lng: number;
  timestamp: string;
  processed: boolean;
}

export interface Webhook {
  id: string;
  business_id: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// API Request/Response types
export interface CreateOrderRequest {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  pickup_address: string;
  delivery_address: string;
  driver_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_delivery?: string;
  notes?: string;
}

export interface CreateGeofenceRequest {
  name: string;
  type: 'circle' | 'polygon';
  center_lat?: number;
  center_lng?: number;
  radius?: number;
  coordinates?: Array<[number, number]>;
  triggers: Omit<GeofenceTrigger, 'id'>[];
}

export interface UpdateLocationRequest {
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// WebSocket/SSE event types
export interface LocationUpdateEvent {
  type: 'location_update';
  driver_id: string;
  order_id?: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface OrderStatusEvent {
  type: 'order_status';
  order_id: string;
  status: Order['status'];
  timestamp: string;
}

export interface GeofenceEvent {
  type: 'geofence_event';
  geofence_id: string;
  driver_id: string;
  order_id?: string;
  event_type: 'enter' | 'exit' | 'dwell';
  lat: number;
  lng: number;
  timestamp: string;
}

export type RealtimeEvent = LocationUpdateEvent | OrderStatusEvent | GeofenceEvent;

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  business_name?: string;
  role: 'business_owner' | 'dispatcher' | 'driver';
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

// Dashboard analytics types
export interface DashboardStats {
  total_orders: number;
  active_orders: number;
  completed_today: number;
  active_drivers: number;
  avg_delivery_time: number;
  success_rate: number;
}

export interface OrdersByStatus {
  pending: number;
  assigned: number;
  picked_up: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}

export interface DeliveryMetrics {
  date: string;
  orders_completed: number;
  avg_delivery_time: number;
  success_rate: number;
}