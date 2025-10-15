import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiBox3Line,
  RiTeamLine,
  RiTimeLine,
} from '@remixicon/react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import Map from '../components/map';
import LoadingSpinner from '../components/loading-spinner';
import { dashboardService } from '../services/dashboard.service';

import { useAuthStore } from '../stores/auth.store';
import { ChartOrderStatus } from '@/components/chart-order-status';
import { DeliveryPerformanceChart } from '@/components/delivery-performance-chart';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalDrivers: number;
  activeDrivers: number;
  totalRevenue: number;
  avgDeliveryTime: number;
  orderMetrics: {
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
  };
  deliveryMetrics: {
    onTime: number;
    delayed: number;
    totalDeliveries: number;
  };
  topDrivers: Array<{
    id: string;
    name: string;
    completedOrders: number;
    avgRating: number;
  }>;
}

interface MapData {
  orders: any[];
  drivers: any[];
  geofences: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsData, mapDataResponse] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getMapData(),
      ]);

      setStats(statsData);
      setMapData(mapDataResponse);
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }



  return (
    <div className="">
      {/* Welcome Header */}
      <div className="space-y-1 mb-6">
        <h1 className="text-2xl font-medium capitalize">Hi, {user?.name}!</h1>
        <p className="text-sm text-muted-foreground">
          Here's what's happening with your deliveries today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 min-[1200px]:grid-cols-4 border-y border-x-0 border-border rounded-none bg-gradient-to-br from-sidebar/60 to-sidebar *:-ms-px *:-mt-px -m-px">
        <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
          <div className="relative flex items-center gap-4">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              className="remixicon absolute right-0 top-0 opacity-0 group-has-[a:hover]:opacity-100 transition-opacity text-emerald-500"
            >
              <path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path>
            </svg>
            <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
              <RiBox3Line className="h-5 w-5" />
            </div>
            <div>
              <a
                href="#"
                className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60 before:absolute before:inset-0"
              >
                Total Orders
              </a>
              <div className="text-2xl font-semibold mb-2">
                {stats.totalOrders}
              </div>
              {/* <div className="text-xs text-muted-foreground/60">
                <span className="font-medium text-emerald-500">↗ +12% </span>
                vs last week
              </div> */}
            </div>
          </div>
        </div>
        <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
          <div className="relative flex items-center gap-4">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              className="remixicon absolute right-0 top-0 opacity-0 group-has-[a:hover]:opacity-100 transition-opacity text-emerald-500"
            >
              <path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path>
            </svg>
            <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
              <RiTimeLine className="h-5 w-5" />
            </div>
            <div>
              <a
                href="#"
                className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60 before:absolute before:inset-0"
              >
                Active Orders
              </a>
              <div className="text-2xl font-semibold mb-2">
                {stats.activeOrders}
              </div>
              {/* <div className="text-xs text-muted-foreground/60">
                <span className="font-medium text-emerald-500">↗ +42% </span>
                vs last week
              </div> */}
            </div>
          </div>
        </div>
        <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
          <div className="relative flex items-center gap-4">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              className="remixicon absolute right-0 top-0 opacity-0 group-has-[a:hover]:opacity-100 transition-opacity text-emerald-500"
            >
              <path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path>
            </svg>
            <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
              <RiTeamLine className="h-5 w-5" />
            </div>
            <div>
              <a
                href="#"
                className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60 before:absolute before:inset-0"
              >
                Available Drivers
              </a>
              <div className="text-2xl font-semibold mb-2">
                {stats.activeDrivers}/{stats.totalDrivers}
              </div>
              {/* <div className="text-xs text-muted-foreground/60">
                <span className="font-medium text-emerald-500">↗ +37% </span>
                vs last week
              </div> */}
            </div>
          </div>
        </div>
        <div className="relative p-4 lg:p-5 group before:absolute before:inset-y-8 before:right-0 before:w-px before:bg-gradient-to-b before:from-input/30 before:via-input before:to-input/30 last:before:hidden">
          <div className="relative flex items-center gap-4">
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="currentColor"
              aria-hidden="true"
              className="remixicon absolute right-0 top-0 opacity-0 group-has-[a:hover]:opacity-100 transition-opacity text-emerald-500"
            >
              <path d="M16.0037 9.41421L7.39712 18.0208L5.98291 16.6066L14.5895 8H7.00373V6H18.0037V17H16.0037V9.41421Z"></path>
            </svg>
            <div className="max-[480px]:hidden size-10 shrink-0 rounded-full bg-emerald-600/25 border border-emerald-600/50 flex items-center justify-center text-emerald-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                fill="currentColor"
              >
                <path d="m14.142.147 6.347 6.346a.5.5 0 0 1-.277.848l-1.474.23-5.656-5.657.212-1.485a.5.5 0 0 1 .848-.282ZM2.141 19.257c3.722-3.33 7.995-4.327 12.643-5.52l.446-4.017-4.297-4.298-4.018.447c-1.192 4.648-2.189 8.92-5.52 12.643L0 17.117c2.828-3.3 3.89-6.953 5.303-13.081l6.364-.708 5.657 5.657-.707 6.364c-6.128 1.415-9.782 2.475-13.081 5.304L2.14 19.258Zm5.284-6.029a2 2 0 1 1 2.828-2.828 2 2 0 0 1-2.828 2.828Z"></path>
              </svg>
            </div>
            <div>
              <a
                href="#"
                className="font-medium tracking-widest text-xs uppercase text-muted-foreground/60 before:absolute before:inset-0"
              >
                Total Revenue
              </a>
              <div className="text-2xl font-semibold mb-2">
                ${stats.totalRevenue}
              </div>
              {/* <div className="text-xs text-muted-foreground/60">
                <span className="font-medium text-red-500">↘ -17% </span>
                vs last week
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid auto-rows-min grid-cols-1 2xl:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card className='border-x-0 border-border'>
            <CardHeader>
              <CardTitle>Live Map</CardTitle>
              <CardDescription>
                Real-time view of orders, drivers, and geofences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mapData ? (
                <Map
                  orders={mapData.orders}
                  drivers={mapData.drivers}
                  geofences={mapData.geofences}
                  height="400px"
                />
              ) : (
                <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
                  <p className="text-muted-foreground">Map data unavailable</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        {/* <div className="space-y-6"> */}
          {/* Delivery Performance */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  On-time Delivery
                </span>
                <span className="text-sm font-medium">
                  {formatPercentage(onTimePercentage)}
                </span>
              </div>
              <Progress value={onTimePercentage * 100} className="h-2" />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Avg. Delivery Time</span>
                <span>{formatDuration(stats.avgDeliveryTime)}</span>
              </div>
            </CardContent>
          </Card> */}

          {/* Quick Actions */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                asChild
              >
                <Link to="/orders?status=pending">
                  <RiAlertLine className="h-4 w-4 text-orange-600 mr-3" />
                  View Pending Orders ({stats.orderMetrics.pending || 0})
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                asChild
              >
                <Link to="/drivers">
                  <RiTruckLine className="h-4 w-4 text-blue-600 mr-3" />
                  Manage Drivers
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                asChild
              >
                <Link to="/geofences">
                  <RiMapPinLine className="h-4 w-4 text-purple-600 mr-3" />
                  Configure Geofences
                </Link>
              </Button>
            </CardContent>
          </Card> */}
        {/* </div> */}
      </div>

      <div className="grid auto-rows-min 2xl:grid-cols-2 *:-ms-px *:-mt-px -m-px">
        {/* Delivery Performance Chart */}
        <DeliveryPerformanceChart />

        {/* Order Status Breakdown */}
        <ChartOrderStatus orderMetrics={stats.orderMetrics} />
      </div>

      {/* Top Drivers */}
      <Card className="mt-px border-x-0 border-b-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Drivers</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/drivers">View all</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats.topDrivers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Completed Orders</TableHead>
                  <TableHead>Avg Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.topDrivers.slice(0, 5).map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <Link
                        to={`/drivers/${driver.id}`}
                        className="font-medium text-blue-600 hover:text-blue-500"
                      >
                        {driver.name}
                      </Link>
                    </TableCell>
                    <TableCell>{driver.completedOrders}</TableCell>
                    <TableCell>{driver.avgRating.toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <RiTeamLine className="h-12 w-12 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle>No Drivers Yet</EmptyTitle>
                <EmptyDescription>
                  You haven&apos;t added any drivers yet. Get started by adding
                  your first driver.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <div className="flex gap-2">
                  <Button>Create Driver</Button>
                  <Button variant="outline">Import Drivers</Button>
                </div>
              </EmptyContent>
              <Button
                variant="link"
                asChild
                className="text-muted-foreground"
                size="sm"
              ></Button>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
