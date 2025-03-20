
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRBAC } from '@/contexts/RBACContext';
import { Permission } from '@/services/api';

interface RBACRouteProps {
  children: React.ReactNode;
  resource?: Permission['resource'];
  action?: Permission['action'];
  redirectTo?: string;
}

const RBACRoute: React.FC<RBACRouteProps> = ({ 
  children, 
  resource, 
  action, 
  redirectTo = '/dashboard' 
}) => {
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  
  // For local testing, bypass authentication and RBAC checks
  const isLocalTesting = process.env.NODE_ENV === 'development';
  
  if (isLocalTesting) {
    return <>{children}</>;
  }
  
  // If no resource is specified, just check if the user is authenticated
  if (!resource && !user) {
    return <Navigate to="/login" replace />;
  }
  
  // If resource is specified, check if the user has the required permission
  if (resource && !hasPermission(resource, action)) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return <>{children}</>;
};

export default RBACRoute;
