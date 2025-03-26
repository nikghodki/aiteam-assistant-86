
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { bypassAuthForTesting, user, tokens } = useAuth();
  
  // For testing purposes, allow access to all routes
  if (bypassAuthForTesting) {
    return <>{children}</>;
  }
  
  // In a real implementation, check both user and token validity
  if (!user?.authenticated || !tokens?.accessToken) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
