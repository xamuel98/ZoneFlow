import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@zoneflow/shared';
import { authService } from '../services/auth.service';

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  sessionExpiry: number | null;
  lastActivity: number;
};

type AuthActions = {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'business_owner' | 'driver';
    businessName?: string;
  }) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateActivity: () => void;
  checkSession: () => boolean;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,
      sessionExpiry: null,
      lastActivity: Date.now(),

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login(email, password);
          const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            sessionExpiry,
            lastActivity: Date.now(),
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          const response = await authService.register(data);
          const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            sessionExpiry,
            lastActivity: Date.now(),
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isLoading: false,
          sessionExpiry: null,
          lastActivity: Date.now(),
        });
        // Clear persisted state
        localStorage.removeItem('auth-storage');
      },

      checkAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const user = await authService.getProfile();
          set({ user, isLoading: false, lastActivity: Date.now() });
        } catch (error) {
          // Token is invalid, clear auth state
          set({ 
            user: null, 
            token: null, 
            isLoading: false,
            sessionExpiry: null,
            lastActivity: Date.now(),
          });
          localStorage.removeItem('auth-storage');
        }
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const newToken = await authService.refreshToken();
          const sessionExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
          set({ 
            token: newToken,
            sessionExpiry,
            lastActivity: Date.now(),
          });
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      checkSession: () => {
        const { sessionExpiry, token } = get();
        if (!token || !sessionExpiry) return false;
        
        const now = Date.now();
        const isExpired = now > sessionExpiry;
        
        if (isExpired) {
          get().logout();
          return false;
        }
        
        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        sessionExpiry: state.sessionExpiry,
        lastActivity: state.lastActivity,
      }),
    }
  )
);
