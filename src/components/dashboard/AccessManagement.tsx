
import { useState } from 'react';
import { Users, UserPlus, Lock, Key, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassMorphicCard from '../ui/GlassMorphicCard';

const mockUsers = [
  { id: 1, name: 'Alex Johnson', role: 'Admin', services: ['Kubernetes', 'Database', 'Monitoring'] },
  { id: 2, name: 'Jamie Smith', role: 'Developer', services: ['Kubernetes', 'Monitoring'] },
  { id: 3, name: 'Taylor Wilson', role: 'DevOps', services: ['Kubernetes', 'Database', 'Monitoring', 'CI/CD'] },
  { id: 4, name: 'Morgan Lee', role: 'SRE', services: ['Kubernetes', 'Database', 'Monitoring', 'CI/CD', 'Logging'] },
];

const AccessManagement = () => {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUserClick = (userId: number) => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSelectedUser(userId);
      setLoading(false);
    }, 500);
  };

  const handleToggleAccess = (service: string) => {
    // In a real app, you would make an API call here
    console.log(`Toggle access for service: ${service}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassMorphicCard className="md:col-span-1 p-5">
        <div className="flex items-center mb-4">
          <Users className="text-primary mr-2" size={20} />
          <h3 className="font-medium">Team Members</h3>
        </div>
        
        <div className="space-y-2">
          {mockUsers.map(user => (
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
                const hasAccess = mockUsers.find(u => u.id === selectedUser)?.services.includes(service) || false;
                
                return (
                  <div key={service} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <Key className="text-muted-foreground mr-2" size={16} />
                      <span>{service}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleToggleAccess(service)}
                      className={cn(
                        "flex items-center justify-center w-16 py-1 rounded text-xs font-medium transition-colors",
                        hasAccess 
                          ? "bg-green-50 text-green-600 hover:bg-green-100" 
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      )}
                    >
                      {hasAccess ? (
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
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm p-10">
            {loading ? (
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
