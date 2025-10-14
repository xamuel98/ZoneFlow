import L from 'leaflet'

// Fix for default markers in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom icons for different marker types
export const createCustomIcon = (color: string, icon?: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-sm font-bold" style="background-color: ${color}">
        ${icon || ''}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

// Predefined icons
export const mapIcons = {
  pickup: createCustomIcon('#f59e0b', 'P'),
  delivery: createCustomIcon('#10b981', 'D'),
  driver: createCustomIcon('#3b82f6', '🚗'),
  driverUnavailable: createCustomIcon('#6b7280', '🚗'),
  geofencePickup: createCustomIcon('#f59e0b'),
  geofenceDelivery: createCustomIcon('#10b981'),
  geofenceRestricted: createCustomIcon('#ef4444'),
  geofenceCustom: createCustomIcon('#8b5cf6'),
}

// Calculate bounds for multiple points
export const calculateBounds = (points: Array<{ latitude: number; longitude: number }>) => {
  if (points.length === 0) return null
  
  const latitudes = points.map(p => p.latitude)
  const longitudes = points.map(p => p.longitude)
  
  return L.latLngBounds([
    [Math.min(...latitudes), Math.min(...longitudes)],
    [Math.max(...latitudes), Math.max(...longitudes)]
  ])
}

// Get center point of multiple coordinates
export const getCenterPoint = (points: Array<{ latitude: number; longitude: number }>) => {
  if (points.length === 0) return { latitude: 0, longitude: 0 }
  
  const avgLat = points.reduce((sum, p) => sum + p.latitude, 0) / points.length
  const avgLng = points.reduce((sum, p) => sum + p.longitude, 0) / points.length
  
  return { latitude: avgLat, longitude: avgLng }
}

// Calculate distance between two points (Haversine formula)
export const calculateDistance = (
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number => {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180
  const φ2 = (point2.latitude * Math.PI) / 180
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// Check if point is inside geofence
export const isPointInGeofence = (
  point: { latitude: number; longitude: number },
  geofence: { latitude: number; longitude: number; radius: number }
): boolean => {
  const distance = calculateDistance(point, geofence)
  return distance <= geofence.radius
}

// Default map center (can be customized based on business location)
export const DEFAULT_MAP_CENTER: [number, number] = [40.7128, -74.0060] // New York City
export const DEFAULT_MAP_ZOOM = 13

// Map tile layer configuration
export const MAP_TILE_LAYER = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}