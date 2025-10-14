import { useState, useEffect } from 'react'
import { MapPin, Plus } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '../components/LoadingSpinner'
import Map from '../components/Map'
import { geofencesService, type BackendGeofence } from '../services/geofencesService'
import { formatDate } from '../utils/format'

const Geofences = () => {
  const [geofences, setGeofences] = useState<BackendGeofence[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGeofences()
  }, [])

  const loadGeofences = async () => {
    try {
      setIsLoading(true)
      const data = await geofencesService.getGeofences()
      setGeofences(data)
    } catch (error: any) {
      toast.error('Failed to load geofences')
      console.error('Geofences error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleGeofence = async (id: string) => {
    try {
      await geofencesService.toggleGeofence(id)
      await loadGeofences()
      toast.success('Geofence updated successfully')
    } catch (error: any) {
      toast.error('Failed to update geofence')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Geofences</h1>
          <p className="text-gray-600">Manage delivery zones and restricted areas</p>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          New Geofence
        </button>
      </div>

      {/* Map */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Geofence Map</h3>
        </div>
        <Map geofences={geofences} height="500px" />
      </div>

      {/* Geofences List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">All Geofences</h3>
        </div>
        {geofences.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Radius
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {geofences.map((geofence) => (
                  <tr key={geofence.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{geofence.name}</p>
                        <p className="text-xs text-gray-500">
                          Radius: {geofence.radius}m
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`status-badge ${
                        geofence.type === 'pickup' ? 'bg-blue-100 text-blue-800' :
                        geofence.type === 'delivery' ? 'bg-green-100 text-green-800' :
                        geofence.type === 'restricted' ? 'bg-red-100 text-red-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {geofence.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {geofence.radius}m
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleGeofence(geofence.id)}
                        className={`status-badge ${
                          geofence.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {geofence.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(geofence.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-4">
                        Edit
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No geofences</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first geofence.
            </p>
            <div className="mt-6">
              <button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Create Geofence
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Geofences