
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { rbacApi, Permission, Role, UserRole } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface RBACContextType {
  userRoles: UserRole[];
  userPermissions: Permission[];
  allRoles: Role[];
  isLoading: boolean;
  error: string | null;
  hasPermission: (resource: Permission['resource'], action?: Permission['action']) => boolean;
  refreshPermissions: () => Promise<void>;
  assignRoleToUser: (userId: string, roleId: string) => Promise<boolean>;
  removeRoleFromUser: (userId: string, roleId: string) => Promise<boolean>;
  assignPermissionToUser: (userId: string, permission: Omit<Permission, 'id'>) => Promise<boolean>;
  removePermissionFromUser: (userId: string, permissionId: string) => Promise<boolean>;
  createRole: (role: Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => Promise<Role | null>;
  updateRole: (roleId: string, role: Partial<Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>>) => Promise<Role | null>;
  deleteRole: (roleId: string) => Promise<boolean>;
}

// Default context values
const defaultContext: RBACContextType = {
  userRoles: [],
  userPermissions: [],
  allRoles: [],
  isLoading: false,
  error: null,
  hasPermission: () => false,
  refreshPermissions: async () => {},
  assignRoleToUser: async () => false,
  removeRoleFromUser: async () => false,
  assignPermissionToUser: async () => false,
  removePermissionFromUser: async () => false,
  createRole: async () => null,
  updateRole: async () => null,
  deleteRole: async () => false,
};

const RBACContext = createContext<RBACContextType>(defaultContext);

export const useRBAC = () => useContext(RBACContext);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // For demo/development, we're using local mock data until backend is ready
  const initializeWithMockData = () => {
    // Default roles
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Admin',
        description: 'Full access to all resources',
        isSystem: true,
        permissions: [{ id: '1', resource: 'all', action: 'all' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Operator',
        description: 'Can operate all resources but not manage roles',
        isSystem: true,
        permissions: [
          { id: '2', resource: 'kubernetes', action: 'all' },
          { id: '3', resource: 'jira', action: 'all' },
          { id: '4', resource: 'documentation', action: 'all' },
          { id: '5', resource: 'access', action: 'read' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'ReadOnly',
        description: 'Can only view resources',
        isSystem: true,
        permissions: [
          { id: '6', resource: 'kubernetes', action: 'read' },
          { id: '7', resource: 'jira', action: 'read' },
          { id: '8', resource: 'documentation', action: 'read' },
          { id: '9', resource: 'access', action: 'read' },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setAllRoles(mockRoles);

    // Assign Admin role to current user for demo purposes
    if (user?.id) {
      const mockUserRoles: UserRole[] = [
        {
          userId: user.id,
          roleId: '1',
          roleName: 'Admin',
        },
      ];
      
      setUserRoles(mockUserRoles);
      
      // Set permissions from the Admin role
      setUserPermissions(mockRoles.find(r => r.id === '1')?.permissions || []);
    }
  };

  // Load user permissions from the API
  const loadUserPermissions = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, we would fetch from the API
      // const [roles, permissions, allRolesData] = await Promise.all([
      //   rbacApi.getUserRoles(user.id),
      //   rbacApi.getUserPermissions(user.id),
      //   rbacApi.getRoles()
      // ]);
      
      // For now, use mock data
      initializeWithMockData();
    } catch (err: any) {
      console.error('Failed to load permissions:', err);
      setError(err.message || 'Failed to load permissions');
      toast({
        title: "Error",
        description: err.message || 'Failed to load user permissions',
        variant: "destructive",
      });
      
      // Initialize with mock data as fallback
      initializeWithMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh permissions
  const refreshPermissions = async () => {
    await loadUserPermissions();
  };

  // Check if user has a specific permission
  const hasPermission = (resource: Permission['resource'], action?: Permission['action']) => {
    // Admin has all permissions
    if (userPermissions.some(p => p.resource === 'all' && p.action === 'all')) {
      return true;
    }

    // Check for resource-specific "all" permission
    if (action && userPermissions.some(p => p.resource === resource && p.action === 'all')) {
      return true;
    }

    // Check for specific resource and action
    if (action && userPermissions.some(p => p.resource === resource && p.action === action)) {
      return true;
    }

    // Check for resource-only permission (when action is not specified)
    if (!action && userPermissions.some(p => p.resource === resource)) {
      return true;
    }

    return false;
  };

  // Assign role to user
  const assignRoleToUser = async (userId: string, roleId: string) => {
    try {
      // In a real app, we would call the API
      // await rbacApi.assignRoleToUser(userId, roleId);
      
      // For demo, we'll update local state
      const role = allRoles.find(r => r.id === roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      
      setUserRoles(prev => [...prev, { userId, roleId, roleName: role.name }]);
      
      // Add permissions from this role
      setUserPermissions(prev => [...prev, ...role.permissions]);
      
      toast({
        title: "Success",
        description: `Role "${role.name}" assigned successfully`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to assign role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign role',
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove role from user
  const removeRoleFromUser = async (userId: string, roleId: string) => {
    try {
      // In a real app, we would call the API
      // await rbacApi.removeRoleFromUser(userId, roleId);
      
      // For demo, we'll update local state
      const role = allRoles.find(r => r.id === roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      
      setUserRoles(prev => prev.filter(r => !(r.userId === userId && r.roleId === roleId)));
      
      // Remove permissions from this role
      const permissionIdsToRemove = role.permissions.map(p => p.id);
      setUserPermissions(prev => prev.filter(p => !permissionIdsToRemove.includes(p.id)));
      
      toast({
        title: "Success",
        description: `Role "${role.name}" removed successfully`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to remove role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to remove role',
        variant: "destructive",
      });
      return false;
    }
  };

  // Assign permission to user
  const assignPermissionToUser = async (userId: string, permission: Omit<Permission, 'id'>) => {
    try {
      // In a real app, we would call the API
      // await rbacApi.assignPermissionToUser(userId, permission);
      
      // For demo, we'll update local state
      const newPermission: Permission = {
        ...permission,
        id: `custom-${Date.now()}`,
      };
      
      setUserPermissions(prev => [...prev, newPermission]);
      
      toast({
        title: "Success",
        description: `Permission for ${permission.resource} (${permission.action}) assigned successfully`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to assign permission:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to assign permission',
        variant: "destructive",
      });
      return false;
    }
  };

  // Remove permission from user
  const removePermissionFromUser = async (userId: string, permissionId: string) => {
    try {
      // In a real app, we would call the API
      // await rbacApi.removePermissionFromUser(userId, permissionId);
      
      // For demo, we'll update local state
      setUserPermissions(prev => prev.filter(p => p.id !== permissionId));
      
      toast({
        title: "Success",
        description: 'Permission removed successfully',
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to remove permission:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to remove permission',
        variant: "destructive",
      });
      return false;
    }
  };

  // Create a new role
  const createRole = async (role: Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => {
    try {
      // In a real app, we would call the API
      // const newRole = await rbacApi.createRole(role);
      
      // For demo, we'll update local state
      const newRole: Role = {
        ...role,
        id: `custom-${Date.now()}`,
        isSystem: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      setAllRoles(prev => [...prev, newRole]);
      
      toast({
        title: "Success",
        description: `Role "${role.name}" created successfully`,
      });
      
      return newRole;
    } catch (err: any) {
      console.error('Failed to create role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to create role',
        variant: "destructive",
      });
      return null;
    }
  };

  // Update an existing role
  const updateRole = async (roleId: string, roleUpdate: Partial<Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>>) => {
    try {
      // In a real app, we would call the API
      // const updatedRole = await rbacApi.updateRole(roleId, roleUpdate);
      
      // For demo, we'll update local state
      const roleIndex = allRoles.findIndex(r => r.id === roleId);
      if (roleIndex === -1) {
        throw new Error('Role not found');
      }
      
      const updatedRole: Role = {
        ...allRoles[roleIndex],
        ...roleUpdate,
        updatedAt: new Date().toISOString(),
      };
      
      const newRoles = [...allRoles];
      newRoles[roleIndex] = updatedRole;
      setAllRoles(newRoles);
      
      toast({
        title: "Success",
        description: `Role "${updatedRole.name}" updated successfully`,
      });
      
      return updatedRole;
    } catch (err: any) {
      console.error('Failed to update role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to update role',
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a role
  const deleteRole = async (roleId: string) => {
    try {
      // In a real app, we would call the API
      // await rbacApi.deleteRole(roleId);
      
      // First check if it's a system role
      const role = allRoles.find(r => r.id === roleId);
      if (!role) {
        throw new Error('Role not found');
      }
      
      if (role.isSystem) {
        throw new Error('System roles cannot be deleted');
      }
      
      // For demo, we'll update local state
      setAllRoles(prev => prev.filter(r => r.id !== roleId));
      
      // Also remove this role from any users who have it
      setUserRoles(prev => prev.filter(r => r.roleId !== roleId));
      
      toast({
        title: "Success",
        description: `Role "${role.name}" deleted successfully`,
      });
      
      return true;
    } catch (err: any) {
      console.error('Failed to delete role:', err);
      toast({
        title: "Error",
        description: err.message || 'Failed to delete role',
        variant: "destructive",
      });
      return false;
    }
  };

  // Load initial data when component mounts or user changes
  useEffect(() => {
    loadUserPermissions();
  }, [user?.id]);

  const contextValue: RBACContextType = {
    userRoles,
    userPermissions,
    allRoles,
    isLoading,
    error,
    hasPermission,
    refreshPermissions,
    assignRoleToUser,
    removeRoleFromUser,
    assignPermissionToUser,
    removePermissionFromUser,
    createRole,
    updateRole,
    deleteRole,
  };

  return <RBACContext.Provider value={contextValue}>{children}</RBACContext.Provider>;
};
