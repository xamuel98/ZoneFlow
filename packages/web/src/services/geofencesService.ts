import type { Geofence, GeofenceType } from '@zoneflow/shared'
import { apiService } from './api'

interface CreateGeofenceData {
  name: string
  type: GeofenceType
  latitude: number
  longitude: number
  radius: number
  description?: string
}

interface GeofenceWithEvents extends Geofence {
  recent_events: Array<{
    id: string
    event_type: 'enter' | 'exit'
    timestamp: string
    driver_name: string
    order_id?: string
    tracking_code?: string
  }>
}

class GeofencesService {
  async getGeofences(type?: GeofenceType): Promise<Geofence[]> {
    return apiService.get('/api/geofences', type ? { type } : {})
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