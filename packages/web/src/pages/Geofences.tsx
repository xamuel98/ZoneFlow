import { useState, useEffect } from 'react'
import { RiMapPinLine, RiAddLine, RiEditLine, RiDeleteBinLine } from '@remixicon/react'
import { toast } from 'sonner'
import LoadingSpinner from '../components/loading-spinner'
import Map from '../components/map'
import { geofencesService, type BackendGeofence } from '../services/geofences.service'
import { formatDate } from '../utils/format'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'

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
          <h1 className="text-2xl font-bold">Geofences</h1>
          <p className="text-muted-foreground">Manage delivery zones and restricted areas</p>
        </div>
        <Button>
          <RiAddLine className="w-4 h-4 mr-2" />
          New Geofence
        </Button>
      </div>

      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle>Geofence Map</CardTitle>
          <CardDescription>
            View and manage all geofences on the interactive map
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Map geofences={geofences} height="500px" />
        </CardContent>
      </Card>

      {/* Geofences List */}
      <Card>
        <CardHeader>
          <CardTitle>All Geofences</CardTitle>
          <CardDescription>
            {geofences.length} geofence{geofences.length !== 1 ? 's' : ''} configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {geofences.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Radius</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geofences.map((geofence) => (
                    <TableRow key={geofence.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{geofence.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Radius: {geofence.radius}m
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          geofence.type === 'pickup' ? 'secondary' :
                          geofence.type === 'delivery' ? 'default' :
                          geofence.type === 'restricted' ? 'destructive' :
                          'outline'
                        }>
                          {geofence.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {geofence.radius}m
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleGeofence(geofence.id)}
                        >
                          <Badge variant={geofence.is_active ? 'default' : 'secondary'}>
                            {geofence.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </Button>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(geofence.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <RiEditLine className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RiDeleteBinLine className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <RiMapPinLine className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No geofences</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first geofence.
              </p>
              <div className="mt-6">
                <Button>
                  <RiAddLine className="w-4 h-4 mr-2" />
                  Create Geofence
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Geofences