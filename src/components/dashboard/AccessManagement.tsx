
import { useState, useEffect } from 'react';
import { Users, Lock, Key, Check, X, Link as LinkIcon, ExternalLink, AlertCircle, Send, UserCheck, Shield, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { accessApi, UserAccess, AccessRequest, JiraTicket } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Group {
  id: number;
  name: string;
  description: string;
  status: 'member' | 'pending' | 'rejected' | 'none';
  members: number;
}

const AccessManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showAccessRequestForm, setShowAccessRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessRequests, setAccessRequests] = useState<{group: number, jira: JiraTicket}[]>([]);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'How can I help you with access management today?' }
  ]);

  // Fetch groups data for the current user
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['user-groups'],
    queryFn: async () => {
      // In a real app, use the API
      // return accessApi.getUserGroups();
      
      // For now, use mock data
      return new Promise<Group[]>((resolve) => {
        setTimeout(() => {
          resolve([
            { id: 1, name: 'Infrastructure Team', description: 'Core infrastructure management and planning', status: 'member', members: 12 },
            { id: 2, name: 'Database Admins', description: 'Database administration and optimization', status: 'none', members: 8 },
            { id: 3, name: 'Security Team', description: 'Security operations and compliance', status: 'pending', members: 15 },
            { id: 4, name: 'Cloud Platform', description: 'Cloud infrastructure and services', status: 'member', members: 20 },
            { id: 5, name: 'Networking', description: 'Network architecture and operations', status: 'rejected', members: 10 },
            { id: 6, name: 'Monitoring', description: 'Systems monitoring and alerting', status: 'none', members: 7 },
          ]);
        }, 700);
      });
    },
  });

  // Access request mutation
  const accessRequestMutation = useMutation({
    mutationFn: (request: { groupId: number, reason: string }) => 
      accessApi.requestGroupAccess(request.groupId, request.reason, user.name),
    onSuccess: (data, variables) => {
      toast({
        title: "Access Request Created",
        description: `Jira ticket ${data.key} created for the access request`,
      });
      
      // Add to our local requests list
      setAccessRequests(prev => [
        ...prev, 
        {
          group: variables.groupId,
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

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => accessApi.chatWithAssistant(message, user.name),
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
    onError: (error: any) => {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get assistant response",
        variant: "destructive",
      });
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request. Please try again." 
      }]);
    }
  });

  const handleGroupClick = (groupId: number) => {
    setSelectedGroup(groupId);
    setShowAccessRequestForm(false);
  };

  const handleRequestAccess = (groupId: number) => {
    setSelectedGroup(groupId);
    setShowAccessRequestForm(true);
  };

  const handleAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGroup || !requestReason.trim()) return;
    
    accessRequestMutation.mutate({
      groupId: selectedGroup,
      reason: requestReason
    });
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Send to API
    chatMutation.mutate(message);
    
    setMessage('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'member':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full">
            <UserCheck size={12} />
            <span>Member</span>
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">
            <Clock size={12} />
            <span>Pending</span>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">
            <XCircle size={12} />
            <span>Rejected</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-50 text-gray-600 rounded-full">
            <Shield size={12} />
            <span>No Access</span>
          </div>
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <GlassMorphicCard className="md:col-span-1 p-5">
        <div className="flex items-center mb-4">
          <Users className="text-primary mr-2" size={20} />
          <h3 className="font-medium">My Group Memberships</h3>
        </div>
        
        <div className="space-y-2">
          {(groups || []).map(group => (
            <div 
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              className={cn(
                "flex flex-col p-3 rounded-md transition-colors cursor-pointer",
                selectedGroup === group.id 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-secondary"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-medium text-sm">{group.name}</div>
                {getStatusBadge(group.status)}
              </div>
              <div className="text-xs text-muted-foreground">{group.description}</div>
              <div className="text-xs text-muted-foreground mt-2">{group.members} members</div>
            </div>
          ))}
          
          {(groups || []).length === 0 && !isLoadingGroups && (
            <div className="text-center py-8">
              <AlertCircle size={24} className="mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground text-sm">No groups found</p>
            </div>
          )}
          
          {isLoadingGroups && (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </GlassMorphicCard>
      
      <GlassMorphicCard className="md:col-span-2 p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center">
              <Lock className="text-primary mr-2" size={20} />
              <h3 className="font-medium">Group Access Management</h3>
            </div>
          </div>
            
          <div className="flex flex-col md:flex-row flex-1 divide-y md:divide-y-0 md:divide-x">
            <div className="md:w-3/5 overflow-auto p-5">
              <h4 className="text-sm font-medium mb-4">Group Membership</h4>
              
              <div className="space-y-3">
                {(groups || []).map(group => {
                  const pendingRequest = accessRequests.find(
                    r => r.group === group.id
                  );
                  
                  return (
                    <div 
                      key={group.id}
                      onClick={() => handleGroupClick(group.id)}
                      className={cn(
                        "border rounded-md p-4 transition-colors cursor-pointer",
                        selectedGroup === group.id 
                          ? "border-primary/50 bg-primary/5" 
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex justify-between">
                        <h5 className="font-medium">{group.name}</h5>
                        {getStatusBadge(group.status)}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 mb-2">{group.description}</p>
                      
                      <div className="flex justify-between items-center mt-3">
                        <div className="text-xs text-muted-foreground">
                          {group.members} members
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {pendingRequest && (
                            <a 
                              href={pendingRequest.jira.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <LinkIcon size={12} />
                              {pendingRequest.jira.key}
                              <ExternalLink size={10} />
                            </a>
                          )}
                          
                          {group.status === 'none' && !pendingRequest && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestAccess(group.id);
                              }}
                              className="px-3 py-1 text-xs bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                            >
                              Request Access
                            </button>
                          )}
                          
                          {group.status === 'member' && (
                            <button className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors">
                              Leave Group
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {showAccessRequestForm && selectedGroup && (
                <div className="mt-6 p-4 border border-primary/20 bg-primary/5 rounded-md animate-fade-in">
                  <h4 className="text-sm font-medium mb-2">
                    Request Access for {groups?.find(g => g.id === selectedGroup)?.name}
                  </h4>
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
            </div>
            
            <div className="md:w-2/5 flex flex-col h-full">
              <div className="p-4 border-b bg-muted/30">
                <h4 className="text-sm font-medium">Access Assistant</h4>
              </div>
              
              <div className="flex-1 p-4 overflow-auto">
                <div className="space-y-4 mb-4">
                  {chatHistory.map((chat, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "flex",
                        chat.role === 'assistant' ? "justify-start" : "justify-end"
                      )}
                    >
                      <div className={cn(
                        "max-w-[85%] rounded-lg p-3 text-sm",
                        chat.role === 'assistant' 
                          ? "bg-muted text-foreground rounded-tl-none" 
                          : "bg-primary text-primary-foreground rounded-tr-none"
                      )}>
                        {chat.content}
                      </div>
                    </div>
                  ))}
                  
                  {chatMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground rounded-lg rounded-tl-none max-w-[85%] p-3">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t">
                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask about access management..."
                    className="flex-1 px-3 py-2 text-sm bg-background border rounded-md focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={chatMutation.isPending || !message.trim()}
                    className="p-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </GlassMorphicCard>
    </div>
  );
};

export default AccessManagement;
