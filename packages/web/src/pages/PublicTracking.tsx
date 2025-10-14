import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Package, Truck } from 'lucide-react'
import { toast } from 'sonner'
import Map from '../components/Map'
import LoadingSpinner from '../components/LoadingSpinner'
import { ordersService } from '../services/ordersService'
import { formatDate } from '../utils/format'

const PublicTracking = () => {
  const { trackingCode } = useParams()
  const [trackingData, setTrackingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (trackingCode) {
      loadTrackingData()
    }
  }, [trackingCode])

  const loadTrackingData = async () => {
    if (!trackingCode) return

    try {
      setIsLoading(true)
      const data = await ordersService.trackOrder(trackingCode)
      setTrackingData(data)
    } catch (error: any) {
      toast.error('Order not found or tracking code is invalid')
      console.error('Tracking error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Order not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please check your tracking code and try again.
          </p>
        </div>
      </div>
    )
  }

  const { order } = trackingData

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Track Your Order</h1>
              <p className="text-gray-600">Tracking Code: {order.tracking_code}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Status */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span className={`status-badge status-${order.status.replace('_', '-')} text-lg px-4 py-2`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-center text-sm text-gray-600">
                  Last updated: {formatDate(order.updated_at)}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Delivery Information</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-600">{order.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pickup</p>
                  <p className="text-sm text-gray-900">{order.pickup_address}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</p>
                  <p className="text-sm text-gray-900">{order.delivery_address}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Timeline</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Order Created</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                </div>
                {order.actual_pickup && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Picked Up</p>
                      <p className="text-xs text-gray-500">{formatDate(order.actual_pickup)}</p>
                    </div>
                  </div>
                )}
                {order.actual_delivery && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Delivered</p>
                      <p className="text-xs text-gray-500">{formatDate(order.actual_delivery)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Live Tracking</h3>
                <p className="text-sm text-gray-500">
                  Real-time location of your order
                </p>
              </div>
              <Map
                orders={[order]}
                height="600px"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicTracking