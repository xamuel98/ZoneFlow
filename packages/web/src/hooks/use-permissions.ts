import { useMemo } from 'react';
import { useAuthStore } from '../stores/auth.store';
import type { User } from '@zoneflow/shared';

export type Permission = 
  | 'view_dashboard'
  | 'manage_orders'
  | 'create_orders'
  | 'edit_orders'
  | 'delete_orders'
  | 'manage_drivers'
  | 'create_drivers'
  | 'edit_drivers'
  | 'delete_drivers'
  | 'invite_drivers'
  | 'manage_geofences'
  | 'create_geofences'
  | 'edit_geofences'
  | 'delete_geofences'
  | 'view_monitoring'
  | 'manage_settings'
  | 'view_analytics'
  | 'manage_users'
  | 'system_admin';

export type Role = 'business_owner' | 'driver' | 'admin';

// Define permissions for each role
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  business_owner: [
    'view_dashboard',
    'manage_orders',
    'create_orders',
    'edit_orders',
    'delete_orders',
    'manage_drivers',
    'create_drivers',
    'edit_drivers',
    'delete_drivers',
    'invite_drivers',
    'manage_geofences',
    'create_geofences',
    'edit_geofences',
    'delete_geofences',
    'view_monitoring',
    'manage_settings',
    'view_analytics',
  ],
  driver: [
    'view_dashboard',
    'manage_orders', // Limited to assigned orders
    'edit_orders', // Limited to status updates
  ],
  admin: [
    'view_dashboard',
    'manage_orders',
    'create_orders',
    'edit_orders',
    'delete_orders',
    'manage_drivers',
    'create_drivers',
    'edit_drivers',
    'delete_drivers',
    'invite_drivers',
    'manage_geofences',
    'create_geofences',
    'edit_geofences',
    'delete_geofences',
    'view_monitoring',
    'manage_settings',
    'view_analytics',
    'manage_users',
    'system_admin',
  ],
};

export const usePermissions = () => {
  const { user } = useAuthStore();

  const permissions = useMemo(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role as Role] || [];
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (requiredPermissions: Permission[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${action}_${resource}` as Permission;
    return hasPermission(permission);
  };

  const isBusinessOwner = (): boolean => {
    return user?.role === 'business_owner';
  };

  const isDriver = (): boolean => {
    return user?.role === 'driver';
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isBusinessOwner,
    isDriver,
    isAdmin,
    user,
  };
};