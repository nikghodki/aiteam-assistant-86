
import { useState, useEffect } from 'react';
import { Users, UserPlus, Lock, Key, Check, X, Link as LinkIcon, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { accessApi, UserAccess, AccessRequest, JiraTicket } from '@/services/api';

const AccessManagement = () => {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [showAccessRequestForm, setShowAccessRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessRequests, setAccessRequests] = useState<{user: number, service: string, jira: JiraTicket}[]>([]);

  // Mock users data - this would be replaced with API call
  const mockUsers = [
    { id: 1, name: 'Alex Johnson', role: 'Admin', services: ['Kubernetes', 'Database', 'Monitoring'] },
    { id: 2, name: 'Jamie Smith', role: 'Developer', services: ['Kubernetes', 'Monitoring'] },
    { id: 3, name: 'Taylor Wilson', role: 'DevOps', services: ['Kubernetes', 'Database', 'Monitoring', 'CI/CD'] },
    { id: 4, name: 'Morgan Lee', role: 'SRE', services: ['Kubernetes', 'Database', 'Monitoring', 'CI/CD', 'Logging'] },
  ];

  // Fetch users data
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // In a real app, use the API
      // return accessApi.getUsers();
      
      // For now, use mock data
      return new Promise<UserAccess[]>((resolve) => {
        setTimeout(() => {
          resolve(mockUsers);
        }, 500);
      });
    },
  });

  // Access request mutation
  const accessRequestMutation = useMutation({
    mutationFn: (request: AccessRequest) => accessApi.requestAccess(request),
    onSuccess: (data, variables) => {
      toast({
        title: "Access Request Created",
        description: `Jira ticket ${data.key} created for the access request`,
      });
      
      // Add to our local requests list
      setAccessRequests(prev => [
        ...prev, 
        {
          user: variables.userId,
          service: variables.service,
          jira: data
        }
      ]);
      
      setShowAccessRequestForm(false);
      setRequestReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Access Request Failed",
        description: error.message || "Failed to create the access request",
        variant: "destructive",
      });
    }
  });

  // Update access mutation
  const updateAccessMutation = useMutation({
    mutationFn: ({ userId, services }: { userId: number, services: string[] }) => 
      accessApi.updateAccess(userId, services),
    onSuccess: () => {
      toast({
        title: "Access Updated",
        description: "User access permissions have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update access",
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (selectedUser && users) {
      // Simulate API call to get user services
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [selectedUser, users]);

  const handleUserClick = (userId: number) => {
    setSelectedUser(userId);
  };

  const handleToggleAccess = (service: string) => {
    const user = mockUsers.find(u => u.id === selectedUser);
    if (!user) return;
    
    const hasAccess = user.services.includes(service);
    
    if (hasAccess) {
      // If they have access and we're removing it, no need for a request
      const updatedServices = user.services.filter(s => s !== service);
      
      // In a real app, call the API
      // updateAccessMutation.mutate({ userId: user.id, services: updatedServices });
      
      // For mock, just update the services
      user.services = updatedServices;
      
      toast({
        title: "Access Removed",
        description: `Removed ${service} access for ${user.name}`,
      });
    } else {
      // If they don't have access, show the request form
      setSelectedService(service);
      setShowAccessRequestForm(true);
    }
  };

  const handleAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !selectedService || !requestReason.trim()) return;
    
    accessRequestMutation.mutate({
      userId: selectedUser,
      service: selectedService,
      reason: requestReason
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassMorphicCard className="md:col-span-1 p-5">
        <div className="flex items-center mb-4">
          <Users className="text-primary mr-2" size={20} />
          <h3 className="font-medium">Team Members</h3>
        </div>
        
        <div className="space-y-2">
          {(users || mockUsers).map(user => (
            <div 
              key={user.id}
              onClick={() => handleUserClick(user.id)}
              className={cn(
                "flex items-center p-3 rounded-md transition-colors cursor-pointer",
                selectedUser === user.id 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-secondary"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                <span className="text-primary text-sm font-medium">{user.name.charAt(0)}</span>
              </div>
              <div>
                <div className="text-sm font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.role}</div>
              </div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-4 flex items-center justify-center gap-1 text-sm text-primary bg-primary/5 hover:bg-primary/10 transition-colors py-2 rounded-md">
          <UserPlus size={16} />
          <span>Add New User</span>
        </button>
      </GlassMorphicCard>
      
      <GlassMorphicCard className="md:col-span-2 p-5">
        {selectedUser ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Lock className="text-primary mr-2" size={20} />
                <h3 className="font-medium">Access Management</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                User: <span className="font-medium text-foreground">{mockUsers.find(u => u.id === selectedUser)?.name}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {['Kubernetes', 'Database', 'Monitoring', 'CI/CD', 'Logging'].map(service => {
                const user = mockUsers.find(u => u.id === selectedUser);
                const hasAccess = user?.services.includes(service) || false;
                
                // Check if there's a pending request for this service
                const pendingRequest = accessRequests.find(
                  r => r.user === selectedUser && r.service === service
                );
                
                return (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <Key className="text-muted-foreground mr-2" size={16} />
                      <span>{service}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {pendingRequest && (
                        <a 
                          href={pendingRequest.jira.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                        >
                          <LinkIcon size={12} />
                          {pendingRequest.jira.key}
                          <ExternalLink size={10} />
                        </a>
                      )}
                      
                      <button 
                        onClick={() => handleToggleAccess(service)}
                        className={cn(
                          "flex items-center justify-center min-w-16 py-1 rounded text-xs font-medium transition-colors",
                          pendingRequest 
                            ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                            : hasAccess 
                              ? "bg-green-50 text-green-600 hover:bg-green-100" 
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                        )}
                      >
                        {pendingRequest ? (
                          <>
                            <AlertCircle size={12} className="mr-1" />
                            <span>Pending</span>
                          </>
                        ) : hasAccess ? (
                          <>
                            <Check size={12} className="mr-1" />
                            <span>Access</span>
                          </>
                        ) : (
                          <>
                            <X size={12} className="mr-1" />
                            <span>No Access</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {showAccessRequestForm && (
              <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-md animate-fade-in">
                <h4 className="text-sm font-medium mb-2">Request Access for {selectedService}</h4>
                <form onSubmit={handleAccessRequest} className="space-y-4">
                  <div>
                    <label htmlFor="reason" className="block text-xs font-medium mb-1">
                      Reason for Access
                    </label>
                    <textarea
                      id="reason"
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                      placeholder="Please provide a business justification..."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAccessRequestForm(false)}
                      className="px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={accessRequestMutation.isPending}
                      className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {accessRequestMutation.isPending ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                      ) : (
                        "Submit Request"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-10">
            {loading || isLoadingUsers ? (
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <span>Loading user data...</span>
              </div>
            ) : (
              <div className="text-center">
                <Users size={40} className="mx-auto text-muted-foreground/50 mb-2" />
                <p>Select a user to manage their access</p>
              </div>
            )}
          </div>
        )}
      </GlassMorphicCard>
    </div>
  );
};

export default AccessManagement;
