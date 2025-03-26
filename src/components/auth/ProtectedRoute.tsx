
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // All routes are accessible without authentication
  return <>{children}</>;
};

export default ProtectedRoute;
