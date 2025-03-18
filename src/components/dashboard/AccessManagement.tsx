import { useState, useEffect, useRef } from 'react';
import { Users, Lock, Key, Check, X, Link as LinkIcon, ExternalLink, AlertCircle, Send, UserCheck, Shield, Clock, XCircle, Search, RefreshCw, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { accessApi, UserAccess, AccessRequest, JiraTicket } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';

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
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'How can I help you with access management today?' }
  ]);

  // Fetch groups data for the current user
  const { data: groups, isLoading: isLoadingGroups, refetch } = useQuery({
    queryKey: ['user-groups', user.email],
    queryFn: () => accessApi.getUserGroups(user.email),
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: (message: string) => accessApi.chatWithAssistant(message, user.email),
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

  // Leave group mutation
  const leaveGroupMutation = useMutation({
    mutationFn: (groupName: string) => {
      return accessApi.leaveGroup(groupName, user.email);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "You have left the group",
      });
      
      // Refetch groups to update the UI
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave group",
        variant: "destructive",
      });
    }
  });

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

  const handleLeaveGroup = (groupId: number, groupName: string) => {
    if (window.confirm(`Are you sure you want to leave ${groupName}?`)) {
      leaveGroupMutation.mutate(groupName);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => !prev);
  };

  useEffect(() => {
    if (autoRefresh) {
      refreshTimerRef.current = window.setInterval(() => {
        refetch();
      }, 30000); // 30 seconds
    } else if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Clean up on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refetch]);

  const filteredGroups = groups?.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
      {/* My Group Memberships */}
      <GlassMorphicCard className="md:col-span-1 overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="text-primary mr-2" size={20} />
              <h3 className="font-medium">My Group Memberships</h3>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleAutoRefresh}
                className={cn(
                  "text-xs p-1 rounded flex items-center gap-1",
                  autoRefresh ? "text-green-600" : "text-gray-400"
                )}
                title={autoRefresh ? "Auto-refresh enabled (30s)" : "Auto-refresh disabled"}
              >
                <RefreshCw size={14} className={autoRefresh ? "animate-spin-slow" : ""} />
                <span className="sr-only md:not-sr-only md:inline">Auto</span>
              </button>
              
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="text-xs p-1 rounded text-primary flex items-center gap-1"
                title="Refresh now"
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span className="sr-only md:not-sr-only md:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {/* Search bar */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <Input 
              type="text"
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1">
            {filteredGroups.map(group => (
              <div 
                key={group.id}
                className="flex flex-col p-3 rounded-md transition-colors cursor-pointer hover:bg-secondary border border-border/30"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="font-medium text-sm">{group.name}</div>
                  {getStatusBadge(group.status)}
                </div>
                <div className="text-xs text-muted-foreground">{group.description}</div>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-muted-foreground">{group.members} members</div>
                  
                  {group.status === 'member' && (
                    <button
                      onClick={() => handleLeaveGroup(group.id, group.name)}
                      className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Leave this group"
                    >
                      <LogOut size={12} />
                      <span>Leave</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {filteredGroups.length === 0 && !isLoadingGroups && (
              <div className="text-center py-8">
                <AlertCircle size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? "No matching groups found" : "No groups found"}
                </p>
              </div>
            )}
            
            {isLoadingGroups && (
              <div className="flex justify-center items-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </GlassMorphicCard>
      
      {/* Access Management Assistant */}
      <GlassMorphicCard className="md:col-span-2 p-0 overflow-hidden flex flex-col h-full" style={{ maxHeight: "500px" }}>
        <div className="flex items-center justify-between p-5 border-b bg-muted/20">
          <div className="flex items-center">
            <Lock className="text-primary mr-2" size={20} />
            <h3 className="font-medium">Access Assistant</h3>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto bg-background/50">
          <div className="space-y-4">
            {chatHistory.map((chat, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex",
                  chat.role === 'assistant' ? "justify-start" : "justify-end"
                )}
              >
                <div className={cn(
                  "max-w-[85%] rounded-lg p-3 text-sm shadow-sm",
                  chat.role === 'assistant' 
                    ? "bg-muted text-foreground rounded-tl-none border border-border/20" 
                    : "bg-primary text-primary-foreground rounded-tr-none"
                )}>
                  {chat.content}
                </div>
              </div>
            ))}
            
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg rounded-tl-none max-w-[85%] p-3 shadow-sm border border-border/20">
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
        
        <div className="p-4 border-t mt-auto bg-card/50">
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about access management..."
              className="flex-1"
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
      </GlassMorphicCard>
    </div>
  );
};

export default AccessManagement;
