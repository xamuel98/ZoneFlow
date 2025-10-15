import { Outlet } from 'react-router-dom';
import { useDriverStore } from '../stores/driver-store';
import { useEffect } from 'react';
import DriverList from '../components/drivers/driver-list';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import CreateDriverDialog from '../components/drivers/create-driver-dialog';
import EditDriverDialog from '../components/drivers/edit-driver-dialog';
import ImportDriversDialog from '../components/drivers/import-drivers-dialog';
import { Users, UserCheck, UserX, Activity } from 'lucide-react';

const DriversPage = () => {
  const { stats, fetchStats } = useDriverStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Drivers</h1>
          <p className="text-muted-foreground">
            Manage your delivery drivers and their assignments
          </p>
        </div>
      </div>

      {/* Driver Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active driver accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.available || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for assignments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Busy</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.busy || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently on delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offline</CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats?.offline || 0}</div>
            <p className="text-xs text-muted-foreground">
              Not available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Driver List */}
      <DriverList />

      {/* Modal Dialogs */}
      <CreateDriverDialog />
      <EditDriverDialog />
      <ImportDriversDialog />

      {/* Outlet for nested routes */}
      <Outlet />
    </div>
  );
};

export default DriversPage;