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
import type { Order, Geofence } from '@zoneflow/shared'

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
  geofences?: Geofence[]
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
      if (order.pickup_latitude && order.pickup_longitude) {
        L.marker([order.pickup_latitude, order.pickup_longitude], {
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
      if (order.delivery_latitude && order.delivery_longitude) {
        L.marker([order.delivery_latitude, order.delivery_longitude], {
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
        pickup: '#f59e0b',
        delivery: '#10b981',
        restricted: '#ef4444',
        custom: '#8b5cf6'
      }[geofence.type] || '#8b5cf6'

      L.circle([geofence.latitude, geofence.longitude], {
        radius: geofence.radius,
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
            <p class="text-sm text-gray-600">Radius: ${geofence.radius}m</p>
            <p class="text-xs text-gray-500">
              Status: ${geofence.is_active ? 'Active' : 'Inactive'}
            </p>
            ${geofence.description ? 
              `<p class="text-xs text-gray-500">${geofence.description}</p>` : 
              ''
            }
          </div>
        `)
        .addTo(map)
    })

    // Auto-fit bounds if there are markers
    const allPoints = [
      ...orders.flatMap(order => [
        order.pickup_latitude && order.pickup_longitude ? 
          { latitude: order.pickup_latitude, longitude: order.pickup_longitude } : null,
        order.delivery_latitude && order.delivery_longitude ? 
          { latitude: order.delivery_latitude, longitude: order.delivery_longitude } : null
      ]).filter(Boolean),
      ...drivers.map(driver => ({ latitude: driver.latitude, longitude: driver.longitude })),
      ...geofences.map(geofence => ({ latitude: geofence.latitude, longitude: geofence.longitude }))
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