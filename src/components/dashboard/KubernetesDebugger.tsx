
import { useState, useEffect, KeyboardEvent } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Trash, 
  Save, 
  Send, 
  Server, 
  Download,
  X, 
  ChevronDown
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { kubernetesApi } from '@/services/api';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ClusterInfo {
  arn: string;
  name: string;
  status?: 'healthy' | 'warning' | 'error';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

const environments = [
  { id: 'production', name: 'Production', color: 'green' },
  { id: 'qa', name: 'QA', color: 'amber' },
  { id: 'staging', name: 'Staging', color: 'blue' }
] as const;

type Environment = typeof environments[number]['id'];

const KubernetesDebugger = () => {
  const { toast } = useToast();
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment>('qa');
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedClusterArn, setSelectedClusterArn] = useState<string>('');
  const [activeClusters, setActiveClusters] = useState<string[]>([]);
  const [activeClusterArns, setActiveClusterArns] = useState<Record<string, string>>({});
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'How can I help you debug your Kubernetes cluster today?' }
  ]);
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  
  // Command execution state
  const [command, setCommand] = useState('kubectl get pods -n default');
  const [commandOutput, setCommandOutput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [commandLoading, setCommandLoading] = useState(false);
  
  // Debug session state
  const [debugSession, setDebugSession] = useState<{id: string; debugLog: string} | null>(null);
  const [debugSteps, setDebugSteps] = useState<string[]>([]);

  // Get clusters based on environment
  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ['clusters', selectedEnvironment],
    queryFn: () => kubernetesApi.getClusters(selectedEnvironment),
    staleTime: 30000,
  });

  // Set first cluster as selected when clusters load
  useEffect(() => {
    if (clusters && clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
      setSelectedClusterArn(clusters[0].arn);
      
      // Add to active clusters
      if (!activeClusters.includes(clusters[0].name)) {
        setActiveClusters(prev => [...prev, clusters[0].name]);
        setActiveClusterArns(prev => ({...prev, [clusters[0].name]: clusters[0].arn}));
      }
    }
  }, [clusters]);

  // Add selected cluster to active clusters
  useEffect(() => {
    if (selectedCluster && !activeClusters.includes(selectedCluster) && clusters) {
      const clusterInfo = clusters.find(c => c.name === selectedCluster);
      if (clusterInfo) {
        setActiveClusters(prev => [...prev, selectedCluster]);
        setActiveClusterArns(prev => ({...prev, [selectedCluster]: clusterInfo.arn}));
      }
    }
  }, [selectedCluster, activeClusters, clusters]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !selectedClusterArn) return;
    
    setCommandLoading(true);
    try {
      const result = await kubernetesApi.runCommand(selectedClusterArn, command);
      setCommandOutput(result.output);
      
      // Add to command history if unique
      if (!commandHistory.includes(command)) {
        setCommandHistory(prev => [command, ...prev].slice(0, 10));
      }
      
      // Add to debug steps
      setDebugSteps(prev => [...prev, `Executed: ${command}\nResult: ${result.exitCode === 0 ? 'Success' : 'Error'}`]);
      
      if (result.exitCode !== 0) {
        toast({
          title: "Command Error",
          description: result.error || "Command execution failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "API Error",
        description: error.message || "Failed to execute command",
        variant: "destructive",
      });
    } finally {
      setCommandLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedClusterArn) return;

    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    
    setDebugSteps(prev => [...prev, `User query: ${message}`]);
    setChatLoading(true);
    setMessage('');
    
    try {
      const response = await kubernetesApi.chatWithAssistant(selectedClusterArn, message);
      
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: response.response 
      }]);
      
      setDebugSteps(prev => [...prev, `AI Assistant: ${response.response.substring(0, 50)}${response.response.length > 50 ? '...' : ''}`]);
      
      // Check if assistant suggests a command
      const commandMatch = response.response.match(/```(?:bash|sh)?\s*(kubectl .+?)```/);
      if (commandMatch && commandMatch[1]) {
        const suggestedCommand = commandMatch[1].trim();
        setCommand(suggestedCommand);
      }
      
      // Update debug log
      if (debugSession) {
        setDebugSession({
          ...debugSession,
          debugLog: debugSession.debugLog + `\n\nUser: ${message}\n\nAssistant: ${response.response}`
        });
      } else {
        setDebugSession({
          id: `debug-${Date.now()}`,
          debugLog: `Debug Session - ${new Date().toLocaleString()}\n\nCluster: ${selectedCluster}\n\nUser: ${message}\n\nAssistant: ${response.response}`
        });
      }
    } catch (error: any) {
      toast({
        title: "Chat Error",
        description: error.message || "Failed to get assistant response",
        variant: "destructive",
      });
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request. Please try again." 
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleHistoryClick = (cmd: string) => {
    setCommand(cmd);
  };

  const handleEnvironmentChange = (env: Environment) => {
    setSelectedEnvironment(env);
    setSelectedCluster('');
    setSelectedClusterArn('');
  };

  const handleClusterSelect = (name: string, arn: string) => {
    setSelectedCluster(name);
    setSelectedClusterArn(arn);
  };

  const handleRemoveClusterTab = (clusterName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveClusters(prev => prev.filter(name => name !== clusterName));
    
    // Update active cluster ARNs
    const newActiveClusterArns = {...activeClusterArns};
    delete newActiveClusterArns[clusterName];
    setActiveClusterArns(newActiveClusterArns);
    
    // If removing the selected cluster, select another one
    if (selectedCluster === clusterName) {
      const remainingClusters = activeClusters.filter(name => name !== clusterName);
      if (remainingClusters.length > 0) {
        setSelectedCluster(remainingClusters[0]);
        setSelectedClusterArn(activeClusterArns[remainingClusters[0]]);
      } else {
        setSelectedCluster('');
        setSelectedClusterArn('');
      }
    }
  };

  const clearOutput = () => {
    setCommandOutput('');
  };

  const downloadDebugSession = () => {
    if (!debugSession) return;
    
    const blob = new Blob([debugSession.debugLog], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kubernetes-debug-session-${selectedCluster}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Debug Log Downloaded",
      description: "The debug session log has been downloaded successfully",
    });
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
      {/* Environment and Cluster Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
        <div className="space-y-4">
          {/* Environment Selection */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Environment:</div>
            <div className="flex gap-2 flex-wrap">
              {environments.map((env) => {
                const { textColor, bgColor } = getEnvironmentStyle(env.id);
                return (
                  <button
                    key={env.id}
                    onClick={() => handleEnvironmentChange(env.id as Environment)}
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

          {/* Cluster Selection Dropdown */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Cluster:</div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md bg-background hover:bg-muted transition-colors min-w-[200px]">
                {isLoadingClusters ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : selectedCluster ? (
                  <>
                    <Server size={14} className="text-primary" />
                    <span className="flex-1 text-left font-medium truncate">
                      {selectedCluster}
                    </span>
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
                      key={cluster.arn} 
                      onClick={() => handleClusterSelect(cluster.name, cluster.arn)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <Server size={14} />
                        <span>{cluster.name}</span>
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
        
        {/* Download button */}
        {debugSession && (
          <Button
            onClick={downloadDebugSession}
            className="flex items-center gap-2"
            variant="outline"
          >
            <Download size={16} />
            Download Debug Log
          </Button>
        )}
      </div>

      {/* Active Cluster Tabs */}
      {activeClusters.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {activeClusters.map(clusterName => (
            <button
              key={clusterName}
              onClick={() => handleClusterSelect(
                clusterName, 
                activeClusterArns[clusterName]
              )}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors whitespace-nowrap",
                selectedCluster === clusterName
                  ? "bg-purple-600 text-white" // Changed from "bg-primary text-primary-foreground" to purple
                  : "bg-muted hover:bg-muted/80"
              )}
            >
              <Server size={14} />
              <span>{clusterName}</span>
              <X 
                size={14} 
                className="ml-1 opacity-70 hover:opacity-100"
                onClick={(e) => handleRemoveClusterTab(clusterName, e)}
              />
            </button>
          ))}
        </div>
      )}

      {/* Selected Cluster Banner */}
      {selectedCluster && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center gap-2">
          <Server size={18} className="text-primary" />
          <div>
            <div className="text-sm font-medium">Selected Cluster</div>
            <div className="text-lg font-semibold">{selectedCluster}</div>
          </div>
          <div className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full ml-auto">
            {selectedClusterArn}
          </div>
        </div>
      )}

      {/* Main Debug Interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Command Terminal */}
        <GlassMorphicCard className="md:col-span-8">
          <div className="p-4 border-b bg-muted/40">
            <form onSubmit={handleCommandSubmit} className="flex gap-2">
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
                  disabled={!selectedClusterArn || commandLoading}
                />
              </div>
              <Button
                type="submit"
                className="flex items-center gap-1"
                disabled={commandLoading || !selectedClusterArn}
              >
                {commandLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play size={14} />
                )}
                Run
              </Button>
            </form>
          </div>
          
          <div className="relative min-h-[250px] max-h-[350px] overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm">
            {commandLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-300">Running command...</span>
                </div>
              </div>
            ) : null}
            
            {commandOutput ? (
              <pre className="whitespace-pre-wrap">{commandOutput}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span>Command output will appear here</span>
              </div>
            )}
          </div>
          
          {commandOutput && (
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
            </div>
          )}
        </GlassMorphicCard>
        
        {/* Command History */}
        <GlassMorphicCard className="md:col-span-4">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Command History</h3>
          </div>
          
          <div className="p-3 max-h-[350px] overflow-auto">
            <div className="space-y-2">
              {commandHistory.map((cmd, index) => (
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
              
              {commandHistory.length === 0 && (
                <div className="text-center text-muted-foreground text-xs p-4">
                  <p>No command history yet</p>
                </div>
              )}
            </div>
          </div>
        </GlassMorphicCard>
      </div>

      {/* Chat and Debug Steps */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Chat Interface */}
        <GlassMorphicCard className="md:col-span-8">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Kubernetes Assistant</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ask questions in natural language to debug your Kubernetes issues
            </p>
          </div>
          
          <div className="p-4 h-[350px] flex flex-col">
            <div className="flex-1 space-y-4 mb-4 overflow-auto">
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
              
              {chatLoading && (
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
            
            <form onSubmit={handleChatSubmit} className="flex gap-2 mt-auto">
              <div className="relative flex-1">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  className="w-full resize-none bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none min-h-[40px] py-2"
                  placeholder={selectedClusterArn 
                    ? "Ask about your Kubernetes issues... (Press Enter to send)" 
                    : "Please select a cluster first..."
                  }
                  disabled={chatLoading || !selectedClusterArn}
                  rows={2}
                />
              </div>
              <Button
                type="submit"
                size="icon"
                className="rounded-full h-10 w-10"
                disabled={chatLoading || !message.trim() || !selectedClusterArn}
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </GlassMorphicCard>
        
        {/* Debug Steps */}
        <GlassMorphicCard className="md:col-span-4">
          <div className="p-4 border-b bg-muted/40 flex justify-between items-center">
            <h3 className="font-medium text-sm">Debugging Steps</h3>
            
            <button 
              onClick={() => setDebugSteps([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              disabled={debugSteps.length === 0}
            >
              <Trash size={14} />
              Clear
            </button>
          </div>
          
          <div className="p-3 h-[350px] overflow-auto">
            {debugSteps.length > 0 ? (
              <ol className="space-y-3 list-decimal list-inside">
                {debugSteps.map((step, index) => (
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
    </div>
  );
};

export default KubernetesDebugger;
