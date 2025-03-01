
import React from 'react';
import { useRBAC } from '@/contexts/RBACContext';
import { Permission } from '@/services/api';

interface PermissionGuardProps {
  resource: Permission['resource'];
  action?: Permission['action'];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  resource, 
  action, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = useRBAC();
  
  if (hasPermission(resource, action)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
};

export default PermissionGuard;
