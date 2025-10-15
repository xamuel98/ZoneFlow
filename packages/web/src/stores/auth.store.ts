import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@zoneflow/shared';
import { authService } from '../services/auth.service';

type AuthState = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
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
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login(email, password);
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        try {
          const response = await authService.register(data);
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isLoading: false });
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
          set({ user, isLoading: false });
        } catch (error) {
          // Token is invalid, clear auth state
          set({ user: null, token: null, isLoading: false });
          localStorage.removeItem('auth-storage');
        }
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const newToken = await authService.refreshToken();
          set({ token: newToken });
        } catch (error) {
          // Refresh failed, logout user
          get().logout();
          throw error;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
