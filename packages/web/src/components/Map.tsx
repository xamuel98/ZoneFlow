import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { 
  DEFAULT_MAP_CENTER, 
  DEFAULT_MAP_ZOOM, 
  MAP_TILE_LAYER,
  mapIcons,
  calculateBounds
} from '../utils/map'
import type { Order } from '@zoneflow/shared'
import type { BackendGeofence } from '../services/geofences.service'

interface MapProps {
  orders?: Order[]
  drivers?: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    is_available: boolean
    current_order_id?: string
  }>
  geofences?: BackendGeofence[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  onMapClick?: (lat: number, lng: number) => void
}

const Map = ({
  orders = [],
  drivers = [],
  geofences = [],
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  height = '400px',
  className = '',
  onMapClick
}: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView(center, zoom)
    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer(MAP_TILE_LAYER.url, {
      attribution: MAP_TILE_LAYER.attribution,
    }).addTo(map)

    // Handle map clicks
    if (onMapClick) {
      map.on('click', (e) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Clear existing markers and layers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.Circle) {
        map.removeLayer(layer)
      }
    })

    // Add order markers
    orders.forEach((order) => {
      // Pickup marker
      if (order.pickup_lat && order.pickup_lng) {
        L.marker([order.pickup_lat, order.pickup_lng], {
          icon: mapIcons.pickup
        })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">Pickup: ${order.tracking_code}</h3>
              <p class="text-sm text-gray-600">${order.customer_name}</p>
              <p class="text-sm text-gray-600">${order.pickup_address}</p>
              <p class="text-xs text-gray-500">Status: ${order.status}</p>
            </div>
          `)
          .addTo(map)
      }

      // Delivery marker
      if (order.delivery_lat && order.delivery_lng) {
        L.marker([order.delivery_lat, order.delivery_lng], {
          icon: mapIcons.delivery
        })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">Delivery: ${order.tracking_code}</h3>
              <p class="text-sm text-gray-600">${order.customer_name}</p>
              <p class="text-sm text-gray-600">${order.delivery_address}</p>
              <p class="text-xs text-gray-500">Status: ${order.status}</p>
            </div>
          `)
          .addTo(map)
      }
    })

    // Add driver markers
    drivers.forEach((driver) => {
      const icon = driver.is_available ? mapIcons.driver : mapIcons.driverUnavailable
      
      L.marker([driver.latitude, driver.longitude], { icon })
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-semibold">${driver.name}</h3>
            <p class="text-sm text-gray-600">
              Status: ${driver.is_available ? 'Available' : 'Busy'}
            </p>
            ${driver.current_order_id ? 
              `<p class="text-xs text-gray-500">Order: ${driver.current_order_id}</p>` : 
              ''
            }
          </div>
        `)
        .addTo(map)
    })

    // Add geofence circles
    geofences.forEach((geofence) => {
      const color = {
        pickup: '#10b981',
        delivery: '#3b82f6',
        restricted: '#ef4444',
        custom: '#8b5cf6'
      }[geofence.type] || '#8b5cf6'

      // For BackendGeofence, we render all types as circles since they have center_lat/center_lng
      if (geofence.center_lat && geofence.center_lng) {
        L.circle([geofence.center_lat, geofence.center_lng], {
          radius: geofence.radius || 100,
          color: color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 2,
          opacity: geofence.is_active ? 0.8 : 0.3
        })
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${geofence.name}</h3>
              <p class="text-sm text-gray-600">Type: ${geofence.type}</p>
              <p class="text-sm text-gray-600">Radius: ${geofence.radius || 100}m</p>
              <p class="text-xs text-gray-500">
                Status: ${geofence.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          `)
          .addTo(map)
      }
    })

    // Auto-fit bounds if there are markers
    const allPoints = [
      ...orders.flatMap(order => [
        order.pickup_lat && order.pickup_lng ?
        { latitude: order.pickup_lat, longitude: order.pickup_lng } : null,
        order.delivery_lat && order.delivery_lng ?
        { latitude: order.delivery_lat, longitude: order.delivery_lng } : null
      ]).filter((point): point is { latitude: number; longitude: number } => point !== null),
      ...drivers.map(driver => ({ latitude: driver.latitude, longitude: driver.longitude })),
      ...geofences.filter(geofence => geofence.center_lat && geofence.center_lng)
        .map(geofence => ({ latitude: geofence.center_lat!, longitude: geofence.center_lng! }))
    ]

    if (allPoints.length > 0) {
      const bounds = calculateBounds(allPoints)
      if (bounds) {
        map.fitBounds(bounds, { padding: [20, 20] })
      }
    }
  }, [orders, drivers, geofences])

  return (
    <div 
      ref={mapRef} 
      style={{ height }} 
      className={`w-full rounded-lg ${className}`}
    />
  )
}

export default Map