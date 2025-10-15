import type { Geofence } from '@zoneflow/shared'
import { apiService } from './api'

export interface CreateGeofenceData {
  name: string
  type: 'circle' | 'polygon'
  center_lat?: number
  center_lng?: number
  radius?: number
  coordinates?: Array<{ lat: number; lng: number }>
  triggers: string[]
}

// Backend geofence type that matches the actual API response
export interface BackendGeofence {
  id: string
  name: string
  type: 'pickup' | 'delivery' | 'restricted' | 'custom'
  center_lat: number
  center_lng: number
  radius: number
  coordinates: Array<{ lat: number; lng: number }> | null
  triggers: string[]
  is_active: boolean
  business_id: string
  created_at: string
  updated_at: string
}

export interface GeofenceWithEvents extends Geofence {
  events?: Array<{
    id: string
    type: string
    timestamp: string
    driver_id?: string
    order_id?: string
  }>
}

class GeofencesService {
  async getGeofences(type?: BackendGeofence['type']): Promise<BackendGeofence[]> {
    const response = await apiService.get('/api/geofences', type ? { type } : {}) as { geofences: BackendGeofence[] }
    return response.geofences
  }

  async getGeofence(id: string): Promise<GeofenceWithEvents> {
    return apiService.get(`/api/geofences/${id}`)
  }

  async createGeofence(data: CreateGeofenceData): Promise<Geofence> {
    return apiService.post('/api/geofences', data)
  }

  async updateGeofence(id: string, data: Partial<CreateGeofenceData>): Promise<Geofence> {
    return apiService.put(`/api/geofences/${id}`, data)
  }

  async deleteGeofence(id: string): Promise<void> {
    return apiService.delete(`/api/geofences/${id}`)
  }

  async toggleGeofence(id: string): Promise<Geofence> {
    return apiService.patch(`/api/geofences/${id}/toggle`)
  }

  async checkGeofences(latitude: number, longitude: number, driverId: string, orderId?: string): Promise<void> {
    return apiService.post('/api/geofences/check', {
      latitude,
      longitude,
      driver_id: driverId,
      order_id: orderId,
    })
  }
}

export const geofencesService = new GeofencesService()