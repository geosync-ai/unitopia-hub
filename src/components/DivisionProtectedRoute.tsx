import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface DivisionProtectedRouteProps {
  children: React.ReactNode;
  requiredDivisionId?: string; // Optional division ID required to access
  requiredRoles?: string[]; // Optional roles required within the division
}

/**
 * A higher-order component that protects routes based on division membership
 * Can check either specific division membership or roles within divisions
 */
const DivisionProtectedRoute: React.FC<DivisionProtectedRouteProps> = ({ 
  children, 
  requiredDivisionId,
  requiredRoles = [] 
}) => {
  const { isAuthenticated, user, isAdmin, hasAccessToDivision } = useAuth();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If admin, allow access to everything
  if (isAdmin) {
    return <>{children}</>;
  }
  
  // Check if division access is required
  if (requiredDivisionId) {
    // If user doesn't have access to this division, show unauthorized
    if (!hasAccessToDivision(requiredDivisionId)) {
      return <Navigate to="/unauthorized" replace />;
    }
    
    // If specific roles within the division are required
    if (requiredRoles.length > 0) {
      // Find the division membership
      const membership = user?.divisionMemberships?.find(m => m.divisionId === requiredDivisionId);
      
      // Check if user has any of the required roles
      const hasRequiredRole = membership && requiredRoles.includes(membership.role);
      
      if (!hasRequiredRole) {
        return <Navigate to="/unauthorized" replace />;
      }
    }
  }
  
  // All checks passed, render the children
  return <>{children}</>;
};

export default DivisionProtectedRoute; 