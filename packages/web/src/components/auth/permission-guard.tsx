import React from 'react';
import { usePermissions, type Permission } from '../../hooks/use-permissions';
import { Card, CardContent } from '../ui/card';
import { RiLockLine, RiShieldLine } from '@remixicon/react';

interface PermissionGuardProps {
  children: React.ReactNode;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions = [],
  requireAll = false,
  fallback,
  showFallback = true,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  // If no permissions specified, allow access
  if (permissions.length === 0) {
    return <>{children}</>;
  }

  const hasAccess = requireAll 
    ? hasAllPermissions(permissions)
    : hasAnyPermission(permissions);

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback or default unauthorized message
  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showFallback) {
    return null;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <RiShieldLine className="h-12 w-12 text-destructive/60" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-destructive">Access Denied</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showFallback = true,
}) => {
  const { user } = usePermissions();

  const hasAccess = user && allowedRoles.includes(user.role);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showFallback) {
    return null;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <RiLockLine className="h-12 w-12 text-destructive/60" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-destructive">Role Required</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This feature requires {allowedRoles.join(' or ')} role.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};