import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Package, 
  Users, 
  MapPin, 
  Clock,
  AlertCircle,
  Truck
} from 'lucide-react'
import { toast } from 'sonner'
import Map from '../components/Map'
import LoadingSpinner from '../components/LoadingSpinner'
import { dashboardService } from '../services/dashboardService'
import { formatDate, formatDuration, formatPercentage } from '../utils/format'
import { useAuthStore } from '../stores/authStore'

interface DashboardStats {
  totalOrders: number
  activeOrders: number
  totalDrivers: number
  availableDrivers: number
  totalGeofences: number
  ordersByStatus: Record<string, number>
  ordersByPriority: Record<string, number>
  recentOrders: any[]
  deliveryPerformance: {
    onTimeDeliveries: number
    totalDeliveries: number
    averageDeliveryTime: number
  }
  topDrivers: Array<{
    id: string
    name: string
    completedOrders: number
    averageRating: number
  }>
}

interface MapData {
  orders: any[]
  drivers: any[]
  geofences: any[]
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [mapData, setMapData] = useState<MapData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [statsData, mapDataResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMapData()
      ])
      
      setStats(statsData)
      setMapData(mapDataResponse)
    } catch (error: any) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  const onTimePercentage = stats.deliveryPerformance.totalDeliveries > 0 
    ? stats.deliveryPerformance.onTimeDeliveries / stats.deliveryPerformance.totalDeliveries 
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your deliveries today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Orders
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-warning-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Active Orders
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.activeOrders}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-success-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Available Drivers
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.availableDrivers}/{stats.totalDrivers}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Geofences
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalGeofences}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Live Map</h3>
              <p className="text-sm text-gray-500">
                Real-time view of orders, drivers, and geofences
              </p>
            </div>
            {mapData ? (
              <Map
                orders={mapData.orders}
                drivers={mapData.drivers}
                geofences={mapData.geofences}
                height="400px"
              />
            ) : (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">Map data unavailable</p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-6">
          {/* Delivery Performance */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">On-time Delivery</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatPercentage(onTimePercentage)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-600 h-2 rounded-full" 
                  style={{ width: `${onTimePercentage * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Avg. Delivery Time</span>
                <span>{formatDuration(stats.deliveryPerformance.averageDeliveryTime)}</span>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Order Status</h3>
            </div>
            <div className="space-y-3">
              {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`status-badge status-${status.replace('_', '-')}`}>
                      {status.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="space-y-3">
              <Link
                to="/orders?status=pending"
                className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <AlertCircle className="h-5 w-5 text-warning-600 mr-3" />
                View Pending Orders ({stats.ordersByStatus.pending || 0})
              </Link>
              <Link
                to="/drivers"
                className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Truck className="h-5 w-5 text-primary-600 mr-3" />
                Manage Drivers
              </Link>
              <Link
                to="/geofences"
                className="flex items-center p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                Configure Geofences
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link
              to="/orders"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              View all
            </Link>
          </div>
        </div>
        {stats.recentOrders.length > 0 ? (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-500"
                      >
                        {order.tracking_code}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge status-${order.status.replace('_', '-')}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first order.
            </p>
            <div className="mt-6">
              <Link to="/orders" className="btn-primary">
                Create Order
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard