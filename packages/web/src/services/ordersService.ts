import type { Order, OrderStatus, OrderPriority } from '@zoneflow/shared'
import { apiService } from './api'

interface OrdersResponse {
  orders: Order[]
  total: number
  page: number
  limit: number
}

interface CreateOrderData {
  customer_name: string
  customer_phone: string
  customer_email?: string
  pickup_address: string
  pickup_latitude: number
  pickup_longitude: number
  delivery_address: string
  delivery_latitude: number
  delivery_longitude: number
  priority: OrderPriority
  notes?: string
  scheduled_pickup?: string
  scheduled_delivery?: string
}

interface OrderFilters {
  status?: OrderStatus
  priority?: OrderPriority
  page?: number
  limit?: number
}

interface TrackingResponse {
  order: Order
  locationHistory: Array<{
    id: string
    latitude: number
    longitude: number
    timestamp: string
    driver_id: string
    driver_name: string
  }>
}

class OrdersService {
  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    return apiService.get('/api/orders', filters)
  }

  async getOrder(id: string): Promise<Order> {
    return apiService.get(`/api/orders/${id}`)
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    return apiService.post('/api/orders', data)
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return apiService.patch(`/api/orders/${id}/status`, { status })
  }

  async assignDriver(id: string, driverId: string): Promise<Order> {
    return apiService.patch(`/api/orders/${id}/assign`, { driver_id: driverId })
  }

  async trackOrder(trackingCode: string): Promise<TrackingResponse> {
    return apiService.publicGet(`/api/orders/track/${trackingCode}`)
  }
}

export const ordersService = new OrdersService()