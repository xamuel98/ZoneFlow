import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RiShieldLine, RiHomeLine, RiArrowLeftLine } from '@remixicon/react';
import { usePermissions } from '../hooks/use-permissions';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user, isBusinessOwner, isDriver } = usePermissions();

  const handleGoBack = () => {
    navigate(-1);
  };

  const getDefaultRoute = () => {
    if (isBusinessOwner()) return '/dashboard';
    if (isDriver()) return '/dashboard';
    return '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/20 bg-white shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <RiShieldLine className="h-12 w-12 text-destructive" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-gray-900">
                Access Denied
              </h1>
              <p className="text-gray-600">
                You don't have permission to access this page. Please contact your administrator if you believe this is an error.
              </p>
              
              {user && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Current Role:</span> {user.role}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">User:</span> {user.name} ({user.email})
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleGoBack}
                variant="outline"
                className="w-full"
              >
                <RiArrowLeftLine className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                asChild
                className="w-full"
              >
                <Link to={getDefaultRoute()}>
                  <RiHomeLine className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            {/* Help Text */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If you need access to this feature, please contact your system administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}