import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { useNotifications } from '../components/ui/notification-system';

const SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutes before expiry
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes of inactivity

export const useSessionManagement = () => {
  const { 
    sessionExpiry, 
    lastActivity, 
    token, 
    checkSession, 
    updateActivity, 
    refreshToken, 
    logout 
  } = useAuthStore();
  const { warning, error } = useNotifications();

  // Update activity on user interactions
  const handleUserActivity = useCallback(() => {
    if (token) {
      updateActivity();
    }
  }, [token, updateActivity]);

  // Check for session expiry and inactivity
  const checkSessionStatus = useCallback(() => {
    if (!token || !sessionExpiry) return;

    const now = Date.now();
    const timeUntilExpiry = sessionExpiry - now;
    const timeSinceActivity = now - lastActivity;

    // Check for inactivity timeout
    if (timeSinceActivity > INACTIVITY_TIMEOUT) {
      error('Session expired due to inactivity', {
        description: 'Please log in again to continue.',
        action: {
          label: 'Login',
          onClick: () => logout(),
        },
      });
      logout();
      return;
    }

    // Warn about upcoming session expiry
    if (timeUntilExpiry <= SESSION_WARNING_TIME && timeUntilExpiry > 0) {
      const minutesLeft = Math.ceil(timeUntilExpiry / (60 * 1000));
      warning(`Session expires in ${minutesLeft} minutes`, {
        description: 'Your session will expire soon. Click to extend.',
        action: {
          label: 'Extend Session',
          onClick: async () => {
            try {
              await refreshToken();
            } catch (error) {
              console.error('Failed to refresh token:', error);
            }
          },
        },
      });
    }

    // Check if session is expired
    if (!checkSession()) {
      error('Session expired', {
        description: 'Please log in again to continue.',
        action: {
          label: 'Login',
          onClick: () => logout(),
        },
      });
    }
  }, [
    token, 
    sessionExpiry, 
    lastActivity, 
    checkSession, 
    refreshToken, 
    logout, 
    warning, 
    error
  ]);

  // Set up activity listeners
  useEffect(() => {
    if (!token) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [token, handleUserActivity]);

  // Set up session checking interval
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(checkSessionStatus, ACTIVITY_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [token, checkSessionStatus]);

  // Auto-refresh token when close to expiry
  useEffect(() => {
    if (!token || !sessionExpiry) return;

    const timeUntilExpiry = sessionExpiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - SESSION_WARNING_TIME, 60000); // At least 1 minute

    const timeout = setTimeout(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
      }
    }, refreshTime);

    return () => clearTimeout(timeout);
  }, [token, sessionExpiry, refreshToken]);

  return {
    isSessionValid: checkSession(),
    timeUntilExpiry: sessionExpiry ? sessionExpiry - Date.now() : 0,
    timeSinceActivity: lastActivity ? Date.now() - lastActivity : 0,
    extendSession: refreshToken,
  };
};