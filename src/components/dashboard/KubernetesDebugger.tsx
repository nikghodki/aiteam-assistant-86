import { useState } from 'react';
import { Terminal, AlertCircle, CheckCircle, Play, Trash, Save, Send, Server } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { kubernetesApi } from '@/services/api';

const KubernetesDebugger = () => {
  const { toast } = useToast();
  const [command, setCommand] = useState('kubectl get pods -n default');
  const [output, setOutput] = useState('');
  const [history, setHistory] = useState<string[]>([
    'kubectl get pods -n monitoring',
    'kubectl describe pod prometheus-0 -n monitoring',
    'kubectl logs -n kube-system -l k8s-app=kube-dns'
  ]);
  const [selectedCluster, setSelectedCluster] = useState('production');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'How can I help you debug your Kubernetes cluster today?' }
  ]);

  // Available clusters
  const clusters = [
    { id: 'production', name: 'Production', status: 'healthy' },
    { id: 'staging', name: 'Staging', status: 'warning' },
    { id: 'development', name: 'Development', status: 'healthy' },
    { id: 'test', name: 'Test Environment', status: 'error' }
  ];

  // Command execution mutation
  const commandMutation = useMutation({
    mutationFn: ({ cluster, command }: { cluster: string; command: string }) => 
      kubernetesApi.runCommand(cluster, command),
    onSuccess: (data) => {
      setOutput(data.output);
      
      if (!history.includes(command)) {
        setHistory(prev => [command, ...prev].slice(0, 10));
      }
      
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

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: ({ cluster, message }: { cluster: string; message: string }) => 
      kubernetesApi.chatWithAssistant(cluster, message),
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

  // Cluster health query
  const { data: clusterHealth } = useQuery({
    queryKey: ['cluster-health', selectedCluster],
    queryFn: () => {
      // This would be a real API call in production
      // For now, we'll return mock data based on the cluster status
      const cluster = clusters.find(c => c.id === selectedCluster);
      if (cluster?.status === 'error') {
        return { 
          controlPlane: 'warning',
          etcd: 'error',
          scheduler: 'healthy',
          apiGateway: 'error'
        };
      } else if (cluster?.status === 'warning') {
        return { 
          controlPlane: 'healthy',
          etcd: 'healthy',
          scheduler: 'healthy',
          apiGateway: 'warning'
        };
      }
      return { 
        controlPlane: 'healthy',
        etcd: 'healthy',
        scheduler: 'healthy',
        apiGateway: 'healthy'
      };
    },
    // Keep last successful result when refetching
    staleTime: 30000,
  });
  
  const runCommand = () => {
    if (!command.trim()) return;
    commandMutation.mutate({ cluster: selectedCluster, command });
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
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    // Send to API
    chatMutation.mutate({ 
      cluster: selectedCluster, 
      message 
    });
    
    setMessage('');
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

  return (
    <div className="space-y-6">
      {/* Cluster Selector */}
      <div className="flex items-center space-x-4 pb-4">
        <div className="text-sm font-medium">Select Cluster:</div>
        <div className="flex gap-2 flex-wrap">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => setSelectedCluster(cluster.id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                selectedCluster === cluster.id
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-input hover:bg-muted"
              )}
            >
              <Server size={14} />
              <span>{cluster.name}</span>
              <span className={cn(
                "inline-block w-2 h-2 rounded-full ml-1",
                cluster.status === 'healthy' ? "bg-green-500" : 
                cluster.status === 'warning' ? "bg-amber-500" : "bg-red-500"
              )} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassMorphicCard className="md:col-span-3">
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
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                disabled={commandMutation.isPending}
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
        
        <GlassMorphicCard className="md:col-span-1">
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

      {/* Natural Language Assistant */}
      <GlassMorphicCard>
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
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-4 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="Ask about your Kubernetes issues..."
                disabled={chatMutation.isPending}
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassMorphicCard>
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Cluster Health</h3>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clusterHealth && getStatusComponent(clusterHealth.controlPlane)}
                  <span className="text-sm">Control Plane</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clusterHealth && getStatusComponent(clusterHealth.etcd)}
                  <span className="text-sm">etcd</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clusterHealth && getStatusComponent(clusterHealth.scheduler)}
                  <span className="text-sm">Scheduler</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {clusterHealth && getStatusComponent(clusterHealth.apiGateway)}
                  <span className="text-sm">API Gateway</span>
                </div>
              </div>
            </div>
          </div>
        </GlassMorphicCard>
        
        <GlassMorphicCard>
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Quick Actions</h3>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-3">
            <button 
              className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm"
              onClick={() => setCommand('kubectl get pods --all-namespaces')}
            >
              <CheckCircle size={18} className="mb-1 text-primary" />
              <span>Health Check</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm"
              onClick={() => setCommand('kubectl get events --sort-by=.metadata.creationTimestamp')}
            >
              <AlertCircle size={18} className="mb-1 text-primary" />
              <span>View Events</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm"
              onClick={() => setMessage('What pods are in error state?')}
            >
              <Terminal size={18} className="mb-1 text-primary" />
              <span>Debug Issues</span>
            </button>
            
            <button 
              className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm"
              onClick={() => toast({
                title: "Feature Coming Soon",
                description: "Save configuration feature will be available in the next update",
              })}
            >
              <Save size={18} className="mb-1 text-primary" />
              <span>Save Config</span>
            </button>
          </div>
        </GlassMorphicCard>
      </div>
    </div>
  );
};

export default KubernetesDebugger;
