import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RiBox3Line, RiAddLine, RiSearchLine } from '@remixicon/react'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import LoadingSpinner from '../components/loading-spinner'
import { ordersService } from '../services/orders.service'
import { formatDate } from '../utils/format'
import type { Order } from '@zoneflow/shared'

// Define types that are used in the component
type OrderStatus = Order['status']
type OrderPriority = Order['priority']

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<OrderPriority | ''>('')

  useEffect(() => {
    loadOrders()
  }, [statusFilter, priorityFilter])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await ordersService.getOrders({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      })
      setOrders(response.data)
    } catch (error: any) {
      toast.error('Failed to load orders')
      console.error('Orders error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredOrders = orders.filter(order =>
    order.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Manage and track all your delivery orders</p>
        </div>
        <Button asChild>
          <Link to="/orders/new">
            <RiAddLine className="w-4 h-4 mr-2" />
            New Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <RiSearchLine className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | '')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as OrderPriority | '')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
          <CardDescription>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-medium text-primary hover:text-primary/80"
                          >
                            {order.tracking_code}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {order.pickup_address} → {order.delivery_address}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.status === 'delivered' ? 'default' :
                          order.status === 'in_transit' ? 'secondary' :
                          order.status === 'picked_up' ? 'outline' :
                          order.status === 'assigned' ? 'secondary' :
                          order.status === 'cancelled' ? 'destructive' :
                          'outline'
                        }>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          order.priority === 'urgent' ? 'destructive' :
                          order.priority === 'high' ? 'destructive' :
                          order.priority === 'medium' ? 'outline' :
                          'secondary'
                        }>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.created_at)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/orders/${order.id}`}>
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <RiBox3Line className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No orders found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm || statusFilter || priorityFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first order.'}
              </p>
              {!searchTerm && !statusFilter && !priorityFilter && (
                <div className="mt-6">
                  <Button asChild>
                    <Link to="/orders/new">
                      <RiAddLine className="w-4 h-4 mr-2" />
                      Create Order
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Orders