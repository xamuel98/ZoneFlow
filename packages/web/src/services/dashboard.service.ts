import type { Order, Geofence } from '@zoneflow/shared'
import { apiService } from './api'

interface DashboardStats {
  totalOrders: number
  activeOrders: number
  completedOrders: number
  cancelledOrders: number
  totalDrivers: number
  activeDrivers: number
  totalRevenue: number
  avgDeliveryTime: number
  orderMetrics: {
    pending: number
    in_progress: number
    completed: number
    cancelled: number
  }
  deliveryMetrics: {
    onTime: number
    delayed: number
    totalDeliveries: number
  }
  topDrivers: Array<{
    id: string
    name: string
    completedOrders: number
    avgRating: number
  }>
}

interface ActivityItem {
  id: string
  type: 'order' | 'geofence'
  title: string
  description: string
  timestamp: string
  status?: string
  priority?: string
}

interface MapData {
  activeOrders: Array<Order & {
    driver_name?: string
    current_latitude?: number
    current_longitude?: number
  }>
  drivers: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    is_available: boolean
    current_order_id?: string
  }>
  geofences: Geofence[]
}

interface DriverPerformance {
  driver_id: string
  driver_name: string
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  average_delay: number
  average_delivery_time: number
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    return apiService.get('/api/dashboard/stats')
  }

  async getActivity(): Promise<ActivityItem[]> {
    return apiService.get('/api/dashboard/activity')
  }

  async getMapData(): Promise<MapData> {
    return apiService.get('/api/dashboard/map')
  }

  async getDriverPerformance(period: string = '7d'): Promise<DriverPerformance[]> {
    return apiService.get('/api/dashboard/drivers/performance', { period })
  }
}

export const dashboardService = new DashboardService()