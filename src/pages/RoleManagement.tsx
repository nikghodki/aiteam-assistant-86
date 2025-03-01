
import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Edit,
  Check, 
  X, 
  UserPlus,
  UserMinus,
  Key,
} from 'lucide-react';
import { useRBAC } from '@/contexts/RBACContext';
import { Role, Permission } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const RoleManagement = () => {
  const { 
    allRoles, 
    userRoles, 
    createRole, 
    updateRole, 
    deleteRole,
    assignRoleToUser,
    removeRoleFromUser,
    assignPermissionToUser,
    removePermissionFromUser,
    userPermissions
  } = useRBAC();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isCreateRoleDialogOpen, setIsCreateRoleDialogOpen] = useState(false);
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [isAssignPermissionDialogOpen, setIsAssignPermissionDialogOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<Record<string, Record<string, boolean>>>({
    access: { read: false, write: false, admin: false },
    kubernetes: { read: false, write: false, admin: false },
    documentation: { read: false, write: false, admin: false },
    jira: { read: false, write: false, admin: false },
    settings: { read: false, write: false, admin: false },
  });
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedResource, setSelectedResource] = useState<Permission['resource']>('access');
  const [selectedAction, setSelectedAction] = useState<Permission['action']>('read');

  // Create a new role
  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "Role name is required",
        variant: "destructive",
      });
      return;
    }

    // Convert selected permissions to array format
    const permissions: Omit<Permission, 'id'>[] = [];
    
    Object.entries(selectedPermissions).forEach(([resource, actions]) => {
      Object.entries(actions).forEach(([action, isSelected]) => {
        if (isSelected) {
          permissions.push({
            resource: resource as Permission['resource'],
            action: action as Permission['action'],
          });
        }
      });
    });

    if (permissions.length === 0) {
      toast({
        title: "Error",
        description: "At least one permission must be selected",
        variant: "destructive",
      });
      return;
    }

    const roleData = {
      name: newRoleName,
      description: newRoleDescription,
      permissions: permissions.map((p, index) => ({ ...p, id: `temp-${index}` })),
    };

    const result = await createRole(roleData);
    
    if (result) {
      setIsCreateRoleDialogOpen(false);
      resetRoleForm();
    }
  };

  // Reset role form
  const resetRoleForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions({
      access: { read: false, write: false, admin: false },
      kubernetes: { read: false, write: false, admin: false },
      documentation: { read: false, write: false, admin: false },
      jira: { read: false, write: false, admin: false },
      settings: { read: false, write: false, admin: false },
    });
  };

  // Handle permission toggle
  const handlePermissionToggle = (resource: string, action: string, checked: boolean) => {
    setSelectedPermissions(prev => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: checked,
      },
    }));
  };

  // Assign role to user
  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRoleId) {
      toast({
        title: "Error",
        description: "User and role must be selected",
        variant: "destructive",
      });
      return;
    }

    const success = await assignRoleToUser(selectedUserId, selectedRoleId);
    
    if (success) {
      setIsAssignRoleDialogOpen(false);
      setSelectedUserId('');
      setSelectedRoleId('');
    }
  };

  // Assign permission to user
  const handleAssignPermission = async () => {
    if (!selectedUserId || !selectedResource || !selectedAction) {
      toast({
        title: "Error",
        description: "User, resource, and action must be selected",
        variant: "destructive",
      });
      return;
    }

    const permission: Omit<Permission, 'id'> = {
      resource: selectedResource,
      action: selectedAction,
    };

    const success = await assignPermissionToUser(selectedUserId, permission);
    
    if (success) {
      setIsAssignPermissionDialogOpen(false);
      setSelectedUserId('');
      setSelectedResource('access');
      setSelectedAction('read');
    }
  };

  // Delete role confirmation
  const handleDeleteRole = async (roleId: string) => {
    if (window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      await deleteRole(roleId);
    }
  };

  // Format the role permissions for display
  const formatPermissions = (permissions: Permission[]) => {
    const grouped: Record<string, string[]> = {};
    
    permissions.forEach(p => {
      if (!grouped[p.resource]) {
        grouped[p.resource] = [];
      }
      grouped[p.resource].push(p.action);
    });
    
    return Object.entries(grouped).map(([resource, actions]) => (
      <div key={resource} className="text-xs">
        <span className="font-medium capitalize">{resource}:</span> {actions.join(', ')}
      </div>
    ));
  };

  // User information for demo - in a real app, this would be fetched from an API
  const users = [
    { id: '1', name: 'nghodki', email: 'nghodki@cisco.com' },
    { id: '2', name: 'johndoe', email: 'johndoe@example.com' },
    { id: '3', name: 'janedoe', email: 'janedoe@example.com' },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8" />
            Role-Based Access Control
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Manage roles, permissions, and user access to system resources
          </p>
        </div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="user-roles">User Roles</TabsTrigger>
            <TabsTrigger value="user-permissions">User Permissions</TabsTrigger>
          </TabsList>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Roles Management</h2>
              <Dialog open={isCreateRoleDialogOpen} onOpenChange={setIsCreateRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1">
                    <Plus size={16} />
                    Create Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create New Role</DialogTitle>
                    <DialogDescription>
                      Define a new role with specific permissions for your users
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 my-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="role-name">Role Name</Label>
                        <Input
                          id="role-name"
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="e.g., Developer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role-description">Description</Label>
                        <Input
                          id="role-description"
                          value={newRoleDescription}
                          onChange={(e) => setNewRoleDescription(e.target.value)}
                          placeholder="Describe the role's purpose"
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />
                    
                    <div>
                      <Label>Permissions</Label>
                      <div className="mt-2 border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-1/4">Resource</TableHead>
                              <TableHead>Read</TableHead>
                              <TableHead>Write</TableHead>
                              <TableHead>Admin</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(selectedPermissions).map(([resource, actions]) => (
                              <TableRow key={resource}>
                                <TableCell className="font-medium capitalize">{resource}</TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={actions.read}
                                    onCheckedChange={(checked) => 
                                      handlePermissionToggle(resource, 'read', !!checked)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={actions.write}
                                    onCheckedChange={(checked) => 
                                      handlePermissionToggle(resource, 'write', !!checked)
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  <Checkbox
                                    checked={actions.admin}
                                    onCheckedChange={(checked) => 
                                      handlePermissionToggle(resource, 'admin', !!checked)
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateRoleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateRole}>Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allRoles.map((role) => (
                <Card key={role.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{role.name}</CardTitle>
                      {role.isSystem ? (
                        <div className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                          System
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteRole(role.id)}
                          disabled={role.isSystem}
                          title="Delete Role"
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Permissions:</Label>
                      <div className="space-y-1 pt-1">
                        {formatPermissions(role.permissions)}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 border-t text-xs text-muted-foreground">
                    Created: {new Date(role.createdAt).toLocaleDateString()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* User Roles Tab */}
          <TabsContent value="user-roles" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">User Role Assignments</h2>
              <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1">
                    <UserPlus size={16} />
                    Assign Role
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Assign Role to User</DialogTitle>
                    <DialogDescription>
                      Give a user access to specific capabilities by assigning a role
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="user">Select User</Label>
                      <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Select Role</Label>
                      <Select
                        value={selectedRoleId}
                        onValueChange={setSelectedRoleId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {allRoles.map(role => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssignRoleDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignRole}>Assign Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => {
                      const userRolesList = userRoles.filter(ur => ur.userId === user.id);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name} <span className="text-xs text-muted-foreground">({user.email})</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userRolesList.length > 0 ? (
                                userRolesList.map(ur => (
                                  <div key={ur.roleId} className="bg-muted px-2 py-0.5 rounded-full text-xs">
                                    {ur.roleName}
                                  </div>
                                ))
                              ) : (
                                <span className="text-muted-foreground text-xs">No roles assigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsAssignRoleDialogOpen(true);
                              }}
                            >
                              <UserPlus size={16} className="text-blue-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Permissions Tab */}
          <TabsContent value="user-permissions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Custom User Permissions</h2>
              <Dialog open={isAssignPermissionDialogOpen} onOpenChange={setIsAssignPermissionDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-1">
                    <Key size={16} />
                    Add Permission
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Custom Permission</DialogTitle>
                    <DialogDescription>
                      Assign a specific permission to a user independent of roles
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="user">Select User</Label>
                      <Select
                        value={selectedUserId}
                        onValueChange={setSelectedUserId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="resource">Resource</Label>
                      <Select
                        value={selectedResource}
                        onValueChange={(value) => setSelectedResource(value as Permission['resource'])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a resource" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="access">Access Control</SelectItem>
                          <SelectItem value="kubernetes">Kubernetes</SelectItem>
                          <SelectItem value="documentation">Documentation</SelectItem>
                          <SelectItem value="jira">Jira Tickets</SelectItem>
                          <SelectItem value="settings">Settings</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="action">Permission Level</Label>
                      <Select
                        value={selectedAction}
                        onValueChange={(value) => setSelectedAction(value as Permission['action'])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select permission level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="write">Write</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssignPermissionDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignPermission}>Add Permission</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => {
                      // For demo purposes, just show all permissions for the current user
                      // In a real app, we'd filter by user ID
                      const showPerms = user.id === '1' ? userPermissions : [];
                      
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name} <span className="text-xs text-muted-foreground">({user.email})</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {showPerms.length > 0 ? (
                                <div className="space-y-1">
                                  {formatPermissions(showPerms)}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No custom permissions</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setIsAssignPermissionDialogOpen(true);
                              }}
                            >
                              <Key size={16} className="text-blue-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RoleManagement;
