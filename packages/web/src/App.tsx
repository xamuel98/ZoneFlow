import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { useEffect } from 'react';

// Pages
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Orders from './pages/orders';
import OrderDetail from './pages/order-detail';
import Geofences from './pages/geofences';
import Drivers from './pages/drivers';
import Settings from './pages/settings';
import PublicTracking from './pages/public-tracking';

// Components
import Layout from './components/layout';
import LoadingSpinner from './components/loading-spinner';
import { ThemeProvider } from './components/theme-provider';

function App() {
  const { user, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Routes>
        {/* Public routes */}
        <Route path="/track/:trackingCode" element={<PublicTracking />} />

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
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="geofences" element={<Geofences />} />
              <Route path="drivers" element={<Drivers />}>
                <Route path="create" element={<div />} />
                <Route path="edit/:id" element={<div />} />
                <Route path="import" element={<div />} />
              </Route>
              <Route path="settings" element={<Settings />} />
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
  );
}

export default App;
