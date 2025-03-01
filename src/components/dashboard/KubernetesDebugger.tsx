import { useState, useEffect, KeyboardEvent } from 'react';
import { Terminal, AlertCircle, CheckCircle, Play, Trash, Save, Send, Server, Link, ExternalLink, Plus, RotateCcw, History, ChevronDown } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { kubernetesApi, JiraTicket, KubernetesCluster } from '@/services/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";

interface DebugSession {
  id: string;
  description: string;
  createdAt: string;
  jiraTicket: JiraTicket;
  status: 'active' | 'resolved' | 'pending';
}

const environments = [
  { id: 'production', name: 'Production', color: 'green' },
  { id: 'qa', name: 'QA', color: 'amber' },
  { id: 'staging', name: 'Staging', color: 'blue' }
] as const;

type Environment = typeof environments[number]['id'];

const KubernetesDebugger = () => {
  const { toast } = useToast();
  const [command, setCommand] = useState('kubectl get pods -n default');
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'kubectl get pods -n monitoring',
    'kubectl describe pod prometheus-0 -n monitoring',
    'kubectl logs -n kube-system -l k8s-app=kube-dns'
  ]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('production');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'How can I help you debug your Kubernetes cluster today?' }
  ]);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionDescription, setSessionDescription] = useState('');
  const [currentJiraTicket, setCurrentJiraTicket] = useState<JiraTicket | null>(null);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [debuggingSteps, setDebuggingSteps] = useState<string[]>([]);

  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ['clusters', selectedEnvironment],
    queryFn: () => kubernetesApi.getClusters(selectedEnvironment),
    staleTime: 30000,
  });

  useEffect(() => {
    if (clusters && clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].id);
    }
  }, [clusters, selectedCluster]);

  const mockPastSessions: DebugSession[] = [
    {
      id: 'session-123',
      description: 'Investigate pod crash loops in monitoring namespace',
      createdAt: '2023-05-18 14:30',
      jiraTicket: { key: 'OPS-123', url: '#' },
      status: 'resolved'
    },
    {
      id: 'session-124',
      description: 'Debug networking issues between services',
      createdAt: '2023-05-15 09:15',
      jiraTicket: { key: 'OPS-124', url: '#' },
      status: 'active'
    },
    {
      id: 'session-125',
      description: 'Investigate high CPU usage on worker nodes',
      createdAt: '2023-05-10 16:45',
      jiraTicket: { key: 'OPS-125', url: '#' },
      status: 'pending'
    }
  ];

  const { data: pastSessions } = useQuery({
    queryKey: ['debug-sessions'],
    queryFn: async () => {
      return new Promise<DebugSession[]>((resolve) => {
        setTimeout(() => {
          resolve(mockPastSessions);
        }, 800);
      });
    },
    staleTime: 60000,
  });

  const createSessionMutation = useMutation({
    mutationFn: ({ cluster, description }: { cluster: string; description: string }) => 
      kubernetesApi.createSession(cluster, description),
    onSuccess: (data) => {
      setCurrentJiraTicket(data);
      setShowCreateSession(false);
      setChatHistory([{ role: 'assistant', content: 'New debugging session started. How can I help you?' }]);
      setOutput('');
      setHistory([]);
      setDebuggingSteps([]);
      
      toast({
        title: "Debug Session Created",
        description: `Jira ticket ${data.key} created successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Session Creation Error",
        description: error.message || "Failed to create debug session",
        variant: "destructive",
      });
    }
  });

  const commandMutation = useMutation({
    mutationFn: ({ cluster, command, jiraTicketKey }: { cluster: string; command: string; jiraTicketKey?: string }) => 
      kubernetesApi.runCommand(cluster, command, jiraTicketKey),
    onSuccess: (data) => {
      setOutput(data.output);
      
      if (!history.includes(command)) {
        setHistory(prev => [command, ...prev].slice(0, 10));
      }
      
      setDebuggingSteps(prev => [...prev, `Executed: ${command}\nResult: ${data.exitCode === 0 ? 'Success' : 'Error'}`]);
      
      if (data.exitCode !== 0) {
        toast({
          title: "Command Error",
          description: data.error || "Command execution failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "API Error",
        description: error.message || "Failed to execute command",
        variant: "destructive",
      });
    }
  });

  const chatMutation = useMutation({
    mutationFn: ({ cluster, message, jiraTicketKey }: { cluster: string; message: string; jiraTicketKey?: string }) => 
      kubernetesApi.chatWithAssistant(cluster, message, jiraTicketKey),
    onSuccess: (data) => {
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      setDebuggingSteps(prev => [...prev, `AI Assistant: ${data.response.substring(0, 50)}${data.response.length > 50 ? '...' : ''}`]);
      
      const commandMatch = data.response.match(/```(?:bash|sh)?\s*(kubectl .+?)```/);
      if (commandMatch && commandMatch[1]) {
        const suggestedCommand = commandMatch[1].trim();
        setCommand(suggestedCommand);
      }
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

  const clusterHealth = useQuery({
    queryKey: ['cluster-health', selectedCluster],
    queryFn: () => {
      if (!selectedCluster) return null;
      return kubernetesApi.getClusterHealth(selectedCluster);
    },
    staleTime: 30000,
    enabled: !!selectedCluster
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDescription.trim() || !selectedCluster) return;
    
    createSessionMutation.mutate({
      cluster: selectedCluster,
      description: sessionDescription
    });
  };

  const runCommand = () => {
    if (!command.trim() || !selectedCluster) return;
    commandMutation.mutate({ 
      cluster: selectedCluster, 
      command,
      jiraTicketKey: currentJiraTicket?.key 
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand();
  };

  const handleHistoryClick = (cmd: string) => {
    setCommand(cmd);
  };

  const clearOutput = () => {
    setOutput('');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCluster) return;

    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    setDebuggingSteps(prev => [...prev, `User query: ${message}`]);
    
    chatMutation.mutate({ 
      cluster: selectedCluster, 
      message,
      jiraTicketKey: currentJiraTicket?.key
    });
    
    setMessage('');
  };

  const handleChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e as any);
    }
  };

  const getStatusComponent = (status: string) => {
    if (status === 'healthy') {
      return (
        <>
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Healthy</span>
        </>
      );
    } else if (status === 'warning') {
      return (
        <>
          <AlertCircle size={16} className="text-amber-500" />
          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Warning</span>
        </>
      );
    } else {
      return (
        <>
          <AlertCircle size={16} className="text-red-500" />
          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Error</span>
        </>
      );
    }
  };

  const handleSessionSelect = (session: DebugSession) => {
    setCurrentJiraTicket(session.jiraTicket);
    setChatHistory([{ role: 'assistant', content: `Loaded previous session: ${session.description}. How can I help continue debugging?` }]);
    setShowPastSessions(false);
  };

  const getEnvironmentStyle = (envId: string) => {
    const env = environments.find(e => e.id === envId);
    if (!env) return { textColor: "text-gray-500", bgColor: "bg-gray-100" };

    switch(env.color) {
      case 'green':
        return { textColor: "text-green-700", bgColor: "bg-green-50" };
      case 'amber':
        return { textColor: "text-amber-700", bgColor: "bg-amber-50" };
      case 'blue':
        return { textColor: "text-blue-700", bgColor: "bg-blue-50" };
      default:
        return { textColor: "text-gray-500", bgColor: "bg-gray-100" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Environment:</div>
            <div className="flex gap-2 flex-wrap">
              {environments.map((env) => {
                const { textColor, bgColor } = getEnvironmentStyle(env.id);
                return (
                  <button
                    key={env.id}
                    onClick={() => {
                      setSelectedEnvironment(env.id as Environment);
                      setSelectedCluster('');
                    }}
                    className={cn(
                      "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                      selectedEnvironment === env.id
                        ? `${bgColor} ${textColor} border-current`
                        : "bg-background border-input hover:bg-muted"
                    )}
                  >
                    <span>{env.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Cluster:</div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md bg-background hover:bg-muted transition-colors min-w-[200px]">
                {isLoadingClusters ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : selectedCluster ? (
                  <>
                    <Server size={14} className="text-primary" />
                    <span className="flex-1 text-left font-medium">
                      {clusters?.find(c => c.id === selectedCluster)?.name || selectedCluster}
                    </span>
                    <span className={cn(
                      "inline-block w-2 h-2 rounded-full ml-1",
                      clusters?.find(c => c.id === selectedCluster)?.status === 'healthy' ? "bg-green-500" : 
                      clusters?.find(c => c.id === selectedCluster)?.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                    )} />
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">Select a cluster</span>
                  </>
                )}
                <ChevronDown size={14} className="ml-auto" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[200px]">
                <DropdownMenuLabel>
                  {environments.find(e => e.id === selectedEnvironment)?.name} Clusters
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isLoadingClusters ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm">Loading clusters...</span>
                  </div>
                ) : clusters && clusters.length > 0 ? (
                  clusters.map((cluster) => (
                    <DropdownMenuItem 
                      key={cluster.id} 
                      onClick={() => setSelectedCluster(cluster.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Server size={14} />
                          <span>{cluster.name}</span>
                        </div>
                        <span className={cn(
                          "inline-block w-2 h-2 rounded-full",
                          cluster.status === 'healthy' ? "bg-green-500" : 
                          cluster.status === 'warning' ? "bg-amber-500" : "bg-red-500"
                        )} />
                      </div>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No clusters found
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {currentJiraTicket ? (
            <div className="flex items-center gap-2">
              <a 
                href={currentJiraTicket.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Link size={14} />
                <span>Jira: {currentJiraTicket.key}</span>
                <ExternalLink size={12} />
              </a>
              
              <button
                onClick={() => setShowPastSessions(!showPastSessions)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 transition-colors rounded-full"
              >
                <History size={14} />
                <span>Past Sessions</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateSession(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                disabled={!selectedCluster}
              >
                <Plus size={14} />
                <span>Create Debug Session</span>
              </button>
              
              <button
                onClick={() => setShowPastSessions(!showPastSessions)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 transition-colors rounded-full"
              >
                <History size={14} />
                <span>Past Sessions</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {showPastSessions && (
        <GlassMorphicCard className="animate-fade-in">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="text-sm font-medium">Past Debugging Sessions</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {(pastSessions || mockPastSessions).map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSessionSelect(session)}
                  className="w-full flex items-center justify-between border rounded-md p-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <div className="font-medium text-sm">{session.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{session.createdAt}</span>
                      <a 
                        href={session.jiraTicket.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 flex items-center gap-1 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link size={12} />
                        {session.jiraTicket.key}
                      </a>
                    </div>
                  </div>
                  <div className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    session.status === 'resolved' 
                      ? "bg-green-50 text-green-600" 
                      : session.status === 'active' 
                        ? "bg-blue-50 text-blue-600" 
                        : "bg-amber-50 text-amber-600"
                  )}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </GlassMorphicCard>
      )}

      {showCreateSession && (
        <GlassMorphicCard className="animate-fade-in">
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2">Create Debugging Session</h3>
            <p className="text-xs text-muted-foreground mb-4">
              This will create a Jira ticket to track this debugging session
            </p>
            
            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  placeholder="Describe the issue you're trying to debug..."
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  rows={3}
                  required
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateSession(false)}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSessionMutation.isPending}
                  className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  {createSessionMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                  ) : (
                    "Create Session"
                  )}
                </button>
              </div>
            </form>
          </div>
        </GlassMorphicCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <GlassMorphicCard className="md:col-span-8">
          <div className="p-4 border-b bg-muted/40">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Terminal size={16} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  placeholder="Enter kubectl command..."
                  disabled={!selectedCluster}
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={commandMutation.isPending || !selectedCluster}
              >
                {commandMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play size={14} />
                )}
                Run
              </button>
            </form>
          </div>
          
          <div className="relative min-h-[350px] max-h-[450px] overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm">
            {commandMutation.isPending ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-300">Running command...</span>
                </div>
              </div>
            ) : null}
            
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span>Command output will appear here</span>
              </div>
            )}
          </div>
          
          {output && (
            <div className="p-3 border-t bg-muted/40 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={clearOutput}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash size={14} />
                  Clear
                </button>
                <button 
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Save size={14} />
                  Save Output
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-xs">Found 1 pod with errors</span>
              </div>
            </div>
          )}
        </GlassMorphicCard>
        
        <GlassMorphicCard className="md:col-span-4">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Command History</h3>
          </div>
          
          <div className="p-3 max-h-[400px] overflow-auto">
            <div className="space-y-2">
              {history.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(cmd)}
                  className={cn(
                    "w-full p-2 text-left text-xs rounded-md transition-colors",
                    cmd === command ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <div className="truncate">{cmd}</div>
                </button>
              ))}
              
              {history.length === 0 && (
                <div className="text-center text-muted-foreground text-xs p-4">
                  <p>No command history yet</p>
                </div>
              )}
            </div>
          </div>
        </GlassMorphicCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <GlassMorphicCard className="md:col-span-8">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Kubernetes Assistant</h3>
            <p className="text-xs text-muted-foreground mt-1">Ask questions in natural language to debug your Kubernetes issues</p>
          </div>
          
          <div className="p-4 max-h-[400px] overflow-auto flex flex-col">
            <div className="flex-1 space-y-4 mb-4">
              {chatHistory.map((chat, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex",
                    chat.role === 'assistant' ? "justify-start" : "justify-end"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm",
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
                  <div className="bg-muted text-foreground rounded-lg rounded-tl-none max-w-[80%] p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <form onSubmit={handleChatSubmit} className="flex gap-2 mt-2">
              <div className="relative flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  className="w-full resize-none bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none min-h-[40px] py-2"
                  placeholder="Ask about your Kubernetes issues... (Press Enter to send)"
                  disabled={chatMutation.isPending}
                  rows={2}
                />
              </div>
              <button
                type="submit"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={chatMutation.isPending || !message.trim()}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </GlassMorphicCard>
        
        <GlassMorphicCard className="md:col-span-4">
          <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
            <h3 className="font-medium text-sm">Debugging Steps</h3>
            
            <button 
              onClick={() => setDebuggingSteps([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              disabled={debuggingSteps.length === 0}
            >
              <RotateCcw size={14} />
              Clear
            </button>
          </div>
          
          <div className="p-3 max-h-[400px] overflow-auto">
            {debuggingSteps.length > 0 ? (
              <ol className="space-y-3 list-decimal list-inside">
                {debuggingSteps.map((step, index) => (
                  <li key={index} className="text-xs border-b pb-2 whitespace-pre-wrap">
                    {step}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center text-muted-foreground text-xs p-8">
                <Terminal size={30} className="mx-auto mb-2 opacity-30" />
                <p>Debugging steps will appear here as you run commands and chat with the assistant</p>
              </div>
            )}
          </div>
        </GlassMorphicCard>
      </div>
      
      <GlassMorphicCard>
        <div className="p-4 border-b bg-muted/40">
          <h3 className="font-medium text-sm">Cluster Health</h3>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">Control Plane</div>
              <div className="flex items-center gap-2 mt-2">
                {clusterHealth.data && getStatusComponent(clusterHealth.data.controlPlane)}
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">etcd</div>
              <div className="flex items-center gap-2 mt-2">
                {clusterHealth.data && getStatusComponent(clusterHealth.data.etcd)}
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">Scheduler</div>
              <div className="flex items-center gap-2 mt-2">
                {clusterHealth.data && getStatusComponent(clusterHealth.data.scheduler)}
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-xs text-muted-foreground">API Gateway</div>
              <div className="flex items-center gap-2 mt-2">
                {clusterHealth.data && getStatusComponent(clusterHealth.data.apiGateway)}
              </div>
            </div>
          </div>
        </div>
      </GlassMorphicCard>
    </div>
  );
};

export default KubernetesDebugger;
