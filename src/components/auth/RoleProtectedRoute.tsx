import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRoleBasedAuth } from '@/hooks/useRoleBasedAuth';
import { Loader2, AlertCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: {
    resource: string;
    action: string;
  }[];
  requiredRole?: string;
  allowedRoles?: string[];
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const AccessDeniedCard: React.FC<{ message: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <Card className="max-w-md w-full">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Shield className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">{message}</p>
          <div className="text-sm text-gray-500">
            Contact your administrator if you believe this is an error.
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  requiredRole,
  allowedRoles = [],
  fallbackPath = '/unauthorized',
  showAccessDenied = true
}) => {
  const { user, loading, error, hasPermission } = useRoleBasedAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-gray-600">Checking permissions...</span>
        </div>
      </div>
    );
  }

  // Show error state if authentication failed
  if (error) {
    if (showAccessDenied) {
      return <AccessDeniedCard message={error} />;
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Redirect to unauthorized if no user found
  if (!user) {
    const message = 'You must be logged in to access this resource.';
    if (showAccessDenied) {
      return <AccessDeniedCard message={message} />;
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check specific role requirement
  if (requiredRole && user.role_name !== requiredRole && !user.is_admin) {
    const message = `This resource requires ${requiredRole} role. Your current role: ${user.role_name}`;
    if (showAccessDenied) {
      return <AccessDeniedCard message={message} />;
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check allowed roles (if user role is in the allowed list)
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role_name) && !user.is_admin) {
    const message = `Access restricted to: ${allowedRoles.join(', ')}. Your role: ${user.role_name}`;
    if (showAccessDenied) {
      return <AccessDeniedCard message={message} />;
    }
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const missingPermissions = requiredPermissions.filter(({ resource, action }) =>
      !hasPermission(resource, action)
    );

    if (missingPermissions.length > 0) {
      const permissionList = missingPermissions
        .map(({ resource, action }) => `${resource}:${action}`)
        .join(', ');
      const message = `Missing required permissions: ${permissionList}`;
      
      if (showAccessDenied) {
        return <AccessDeniedCard message={message} />;
      }
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};

export default RoleProtectedRoute; 