import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { useEffect } from 'react';
import { useSessionManagement } from './hooks/use-session-management';

// Pages
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Orders from './pages/orders';
import OrderDetail from './pages/order-detail';
import Geofences from './pages/geofences';
import Drivers from './pages/drivers';
import Settings from './pages/settings';
import PublicTracking from './pages/public-tracking';
import { AcceptInvitationPage } from './pages/accept-invitation';
import MonitoringPage from './pages/monitoring';
import UnauthorizedPage from './pages/unauthorized';

// Components
import Layout from './components/layout';
import { ThemeProvider } from './components/theme-provider';
import ErrorBoundary from './components/ui/error-boundary';
import EnhancedLoading from './components/ui/enhanced-loading';
import { ProtectedRoute } from './components/auth/protected-route';
import { InviteDriverDialog } from './components/drivers/invite-driver-dialog';

function App() {
  const { user, isLoading, checkAuth } = useAuthStore();
  
  // Initialize session management for authenticated users
  useSessionManagement();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <EnhancedLoading
        size="lg"
        text="Loading ZoneFlow..."
        fullScreen
        variant="spinner"
      />
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Routes>
          {/* Public routes */}
          <Route path="/track/:trackingCode" element={<PublicTracking />} />
          <Route path="/accept-invite/:token" element={<AcceptInvitationPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Auth routes */}
          {!user ? (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          ) : (
            <>
              {/* Protected routes */}
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route 
                  path="dashboard" 
                  element={
                    <ProtectedRoute permissions={['view_dashboard']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="orders" 
                  element={
                    <ProtectedRoute permissions={['manage_orders']}>
                      <Orders />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="orders/:id" 
                  element={
                    <ProtectedRoute permissions={['manage_orders']}>
                      <OrderDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="geofences" 
                  element={
                    <ProtectedRoute permissions={['manage_geofences']}>
                      <Geofences />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="drivers" 
                  element={
                    <ProtectedRoute permissions={['manage_drivers']}>
                      <Drivers />
                    </ProtectedRoute>
                  } 
                >
                  <Route path="create" element={<div />} />
                  <Route path="edit/:id" element={<div />} />
                  <Route path="import" element={<div />} />
                  <Route path="?invite=true" element={<div />} />
                </Route>
                <Route 
                  path="settings" 
                  element={
                    <ProtectedRoute permissions={['manage_settings']}>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="monitoring" 
                  element={
                    <ProtectedRoute permissions={['view_monitoring']} allowedRoles={['business_owner', 'admin']}>
                      <MonitoringPage />
                    </ProtectedRoute>
                  } 
                />
              </Route>
              <Route
                path="/login"
                element={<Navigate to="/dashboard" replace />}
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          )}
        </Routes>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
