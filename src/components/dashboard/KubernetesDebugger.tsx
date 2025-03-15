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
  ChevronDown,
  LayoutGrid
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedNamespace, setSelectedNamespace] = useState<string>('default');
  
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

  // Get namespaces for selected cluster
  const { data: namespaces, isLoading: isLoadingNamespaces } = useQuery({
    queryKey: ['namespaces', selectedClusterArn],
    queryFn: () => kubernetesApi.getNamespaces(selectedClusterArn),
    staleTime: 30000,
    enabled: !!selectedClusterArn,
  });

  // Set first cluster as selected when clusters load
  useEffect(() => {
    if (clusters && clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
      setSelectedClusterArn(clusters[0].arn);
    }
  }, [clusters]);

  // Update command when namespace changes
  useEffect(() => {
    if (selectedNamespace && command.includes('-n ')) {
      // Replace the namespace in the existing command
      setCommand(command.replace(/-n\s+([^\s]+)/, `-n ${selectedNamespace}`));
    } else if (selectedNamespace && !command.includes('-n ')) {
      // Add namespace flag if not present
      setCommand(`${command} -n ${selectedNamespace}`);
    }
  }, [selectedNamespace]);

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
    setSelectedNamespace('default');
  };

  const handleClusterSelect = (name: string, arn: string) => {
    setSelectedCluster(name);
    setSelectedClusterArn(arn);
    setSelectedNamespace('default'); // Reset namespace when cluster changes
  };

  const handleNamespaceChange = (value: string) => {
    setSelectedNamespace(value);
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
        return { textColor: "text-professional-green-600", bgColor: "bg-professional-purple-light/20" };
      case 'amber':
        return { textColor: "text-amber-600", bgColor: "bg-amber-50" };
      case 'blue':
        return { textColor: "text-professional-blue-DEFAULT", bgColor: "bg-professional-blue-light/20" };
      default:
        return { textColor: "text-gray-500", bgColor: "bg-gray-100" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Environment, Cluster and Namespace Selection */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-4">
        <div className="md:col-span-8 space-y-4 bg-gradient-professional rounded-lg p-4 border border-border/50 shadow-sm">
          {/* Environment Selection */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Environment:</div>
            <Tabs 
              value={selectedEnvironment} 
              onValueChange={(value) => handleEnvironmentChange(value as Environment)}
              className="w-full"
            >
              <TabsList className="w-full h-9 bg-background/50">
                {environments.map((env) => (
                  <TabsTrigger 
                    key={env.id} 
                    value={env.id}
                    className="flex-1"
                  >
                    {env.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Cluster Selection Dropdown */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Cluster:</div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 px-4 py-2 text-sm border rounded-md bg-background hover:bg-muted transition-colors min-w-[200px] w-full">
                {isLoadingClusters ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : selectedCluster ? (
                  <>
                    <Server size={14} className="text-professional-purple-DEFAULT" />
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
              <DropdownMenuContent className="min-w-[200px] w-full">
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

          {/* Namespace Selection */}
          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Namespace:</div>
            <Select
              value={selectedNamespace}
              onValueChange={handleNamespaceChange}
              disabled={!selectedClusterArn || isLoadingNamespaces}
            >
              <SelectTrigger className="flex items-center gap-2 text-sm border rounded-md bg-background hover:bg-muted transition-colors min-w-[200px] w-full">
                {isLoadingNamespaces ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <>
                    <LayoutGrid size={14} className="text-professional-purple-DEFAULT" />
                    <SelectValue placeholder="Select namespace" />
                  </>
                )}
              </SelectTrigger>
              <SelectContent>
                {isLoadingNamespaces ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm">Loading namespaces...</span>
                  </div>
                ) : namespaces && namespaces.length > 0 ? (
                  namespaces.map((namespace) => (
                    <SelectItem key={namespace} value={namespace}>
                      {namespace}
                    </SelectItem>
                  ))
                ) : (
                  <div className="text-center py-2 text-sm text-muted-foreground">
                    No namespaces found
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Selected Cluster Information & Download button */}
        <div className="md:col-span-4">
          {selectedCluster ? (
            <div className="bg-gradient-soft h-full flex flex-col justify-between rounded-lg p-4 border border-border/50 shadow-sm text-white">
              <div>
                <div className="flex items-center gap-2">
                  <Server size={18} className="text-white" />
                  <div className="text-sm font-medium">Selected Cluster</div>
                </div>
                <div className="text-lg font-semibold mt-1">{selectedCluster}</div>
                <div className="text-xs bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full mt-2 truncate">
                  {selectedClusterArn}
                </div>
                {selectedNamespace && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Namespace</div>
                    <div className="text-md font-medium bg-white/10 px-2 py-1 rounded mt-1 inline-block">
                      {selectedNamespace}
                    </div>
                  </div>
                )}
              </div>
              
              {debugSession && (
                <Button
                  onClick={downloadDebugSession}
                  className="flex items-center gap-2 mt-2 bg-white/20 hover:bg-white/30 text-white"
                  variant="outline"
                >
                  <Download size={16} />
                  Download Debug Log
                </Button>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-muted/20 rounded-lg p-4 border border-border/50 shadow-sm">
              <div className="text-center text-muted-foreground">
                <Server size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Select a cluster to begin debugging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Debug Interface */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Command Terminal */}
        <GlassMorphicCard className="md:col-span-8 bg-gradient-professional">
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
                  className="w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-professional-purple-DEFAULT focus:border-professional-purple-DEFAULT focus:outline-none"
                  placeholder="Enter kubectl command..."
                  disabled={!selectedClusterArn || commandLoading}
                />
              </div>
              <Button
                type="submit"
                className="flex items-center gap-1 bg-professional-purple-DEFAULT hover:bg-professional-purple-dark"
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
          
          <div className="relative min-h-[250px] max-h-[350px] overflow-auto bg-gradient-terminal text-gray-100 p-4 font-mono text-sm rounded-b-lg">
            {commandLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-professional-purple-DEFAULT border-t-transparent rounded-full animate-spin mb-2"></div>
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
        <GlassMorphicCard className="md:col-span-4 overflow-hidden">
          <div className="p-4 border-b bg-gradient-professional">
            <h3 className="font-medium text-sm">Command History</h3>
          </div>
          
          <div className="p-3 max-h-[350px] overflow-auto bg-gradient-to-b from-muted/10 to-muted/30">
            <div className="space-y-2">
              {commandHistory.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(cmd)}
                  className={cn(
                    "w-full p-2 text-left text-xs rounded-md transition-colors",
                    cmd === command ? "bg-professional-purple-DEFAULT/10 text-professional-purple-DEFAULT border-l-2 border-professional-purple-DEFAULT pl-3" : "hover:bg-muted"
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
          <div className="p-4 border-b bg-gradient-professional">
            <h3 className="font-medium text-sm">Kubernetes Assistant</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ask questions in natural language to debug your Kubernetes issues
            </p>
          </div>
          
          <div className="p-4 h-[350px] flex flex-col bg-gradient-to-b from-white/5 to-white/20">
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
                      ? "bg-background text-foreground rounded-tl-none border border-border/40 shadow-sm" 
                      : "bg-gradient-purple text-white rounded-tr-none"
                  )}>
                    {chat.content}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-background text-foreground rounded-lg rounded-tl-none max-w-[80%] p-3 border border-border/40 shadow-sm">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 rounded-full bg-professional-purple-DEFAULT/50 animate-pulse"></div>
                      <div className="w-2 h-2 rounded-full bg-professional-purple-DEFAULT/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-professional-purple-DEFAULT/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
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
                  className="w-full resize-none bg-background border rounded-md text-sm focus:ring-1 focus:ring-professional-purple-DEFAULT focus:border-professional-purple-DEFAULT focus:outline-none min-h-[40px] py-2"
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
                className="rounded-full h-10 w-10 bg-professional-purple-DEFAULT hover:bg-professional-purple-dark"
                disabled={chatLoading || !message.trim() || !selectedClusterArn}
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </GlassMorphicCard>
        
        {/* Debug Steps */}
        <GlassMorphicCard className="md:col-span-4">
          <div className="p-4 border-b bg-gradient-professional flex justify-between items-center">
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
          
          <div className="p-3 h-[350px] overflow-auto bg-gradient-to-b from-muted/10 to-muted/30">
            {debugSteps.length > 0 ? (
              <ol className="space-y-3 list-decimal list-inside">
                {debugSteps.map((step, index) => (
                  <li key={index} className="text-xs border-b border-border/20 pb-2 whitespace-pre-wrap">
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

