
import { useState, useEffect, KeyboardEvent } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Trash, 
  Save, 
  Server, 
  Download,
  X, 
  ChevronDown,
  LayoutGrid,
  Bug,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { kubernetesApi, CommandResult } from '@/services/api';
import KubernetesDebugDrawer from './KubernetesDebugDrawer';
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

interface NamespaceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  component: string;
  message: string;
  timestamp: string;
  kind: string;
  name: string;
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
  
  const [commandOutput, setCommandOutput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [commandLoading, setCommandLoading] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);
  
  const [command, setCommand] = useState('kubectl get pods -n default');
  
  const [debugSession, setDebugSession] = useState<{id: string; debugLog: string} | null>(null);
  const [debugFilePath, setDebugFilePath] = useState<string | undefined>(undefined);
  const [s3FilePath, setS3FilePath] = useState<string | undefined>(undefined);
  
  const [isDebugDrawerOpen, setIsDebugDrawerOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<NamespaceIssue | null>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ['clusters', selectedEnvironment],
    queryFn: () => kubernetesApi.getClusters(selectedEnvironment),
    staleTime: 30000,
  });

  const { data: namespaces, isLoading: isLoadingNamespaces } = useQuery({
    queryKey: ['namespaces', selectedClusterArn],
    queryFn: () => {
      if (!selectedClusterArn) return Promise.resolve([]);
      return kubernetesApi.getNamespaces(selectedClusterArn);
    },
    staleTime: 30000,
    enabled: !!selectedClusterArn,
  });

  const { data: namespaceIssues, isLoading: isLoadingIssues } = useQuery({
    queryKey: ['namespace-issues', selectedClusterArn, selectedNamespace],
    queryFn: () => {
      if (!selectedClusterArn || !selectedNamespace) return Promise.resolve([]);
      return kubernetesApi.getNamespaceIssues(selectedClusterArn, selectedNamespace);
    },
    staleTime: 30000,
    enabled: !!selectedClusterArn && !!selectedNamespace,
  });

  useEffect(() => {
    if (clusters && clusters.length > 0 && !selectedCluster) {
      setSelectedCluster(clusters[0].name);
      setSelectedClusterArn(clusters[0].arn);
    }
  }, [clusters]);

  useEffect(() => {
    if (selectedNamespace && command.includes('-n ')) {
      setCommand(command.replace(/-n\s+([^\s]+)/, `-n ${selectedNamespace}`));
    } else if (selectedNamespace && !command.includes('-n ')) {
      setCommand(`${command} -n ${selectedNamespace}`);
    }
  }, [selectedNamespace]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !selectedClusterArn) return;
    
    setCommandLoading(true);
    setCommandError(null);
    
    try {
      console.log("Running command:", command, "on cluster:", selectedClusterArn, "in namespace:", selectedNamespace);
      
      const result = await kubernetesApi.runCommand(
        selectedClusterArn, 
        command, 
        selectedNamespace || 'default'
      );
      
      console.log("Command result:", result);
      
      if (result.exitCode !== 0) {
        setCommandError(result.error || "Unknown error occurred during command execution");
        setCommandOutput(result.output || "No output available");
      } else {
        setCommandOutput(result.output);
      }
      
      if (!commandHistory.includes(command)) {
        setCommandHistory(prev => [command, ...prev].slice(0, 10));
      }
      
      if (result.exitCode !== 0) {
        toast({
          title: "Command Error",
          description: result.error || "Command execution failed",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("API Error:", error);
      setCommandError(error.message || "Failed to execute command");
      setCommandOutput("Command execution failed. Please check the console for more details.");
      
      toast({
        title: "API Error",
        description: error.message || "Failed to execute command",
        variant: "destructive",
      });
    } finally {
      setCommandLoading(false);
    }
  };

  const sendDebugRequest = async (message: string) => {
    if (!selectedClusterArn || !selectedNamespace) {
      toast({
        title: "Error",
        description: "Cluster and namespace must be selected",
        variant: "destructive",
      });
      return;
    }
    
    setDebugLoading(true);
    setDebugFilePath(undefined);
    setS3FilePath(undefined);
    
    try {
      const response = await kubernetesApi.chatWithAssistant(
        selectedClusterArn, 
        message,
        selectedNamespace
      );
      
      console.log("Debug API response:", response);
      
      const commandMatch = response.response.match(/```(?:bash|sh)?\s*(kubectl .+?)```/);
      if (commandMatch && commandMatch[1]) {
        setCommand(commandMatch[1]);
      }
      
      setDebugSession({
        id: `debug-${Date.now()}`,
        debugLog: `## Request\n${message}\n\n## Response\n${response.response}`
      });
      
      // Clear previous file paths before setting new ones
      if (response.file_name) {
        console.log("Setting debug file path:", response.file_name);
        setDebugFilePath(response.file_name);
        setS3FilePath(undefined);
      } 
      else if (response.s3_file_path) {
        console.log("Setting S3 file path:", response.s3_file_path);
        setS3FilePath(response.s3_file_path);
        setDebugFilePath(undefined);
      } 
      else {
        console.log("No file path in response");
        setDebugFilePath(undefined);
        setS3FilePath(undefined);
      }
      
      setIsDebugDrawerOpen(true);
    } catch (error: any) {
      console.error("Debug API error:", error);
      toast({
        title: "Debug Error",
        description: error.message || "Failed to get debugging assistance",
        variant: "destructive",
      });
    } finally {
      setDebugLoading(false);
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
    setSelectedNamespace('default');
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

  const handleIssueClick = (issue: NamespaceIssue) => {
    const prompt = `I need help debugging an issue in my Kubernetes cluster. 
There's a problem with a ${issue.kind} named "${issue.name}" in the "${selectedNamespace}" namespace:
Issue: ${issue.message}
Severity: ${issue.severity}

What steps should I take to investigate and resolve this issue?`;
    
    setSelectedIssue(issue);
    setIsDebugDrawerOpen(true);
    setDebugLoading(true);
    
    sendDebugRequest(prompt);
  };

  const closeDebugDrawer = () => {
    setIsDebugDrawerOpen(false);
    setSelectedIssue(null);
  };

  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-amber-600 bg-amber-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-4">
        <div className="md:col-span-8 space-y-4 bg-gradient-professional rounded-lg p-4 border border-border/50 shadow-sm">
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

          <div className="flex items-center space-x-4">
            <div className="text-sm font-medium">Namespace:</div>
            <Select
              value={selectedNamespace}
              onValueChange={handleNamespaceChange}
              disabled={!selectedClusterArn || isLoadingNamespaces}
            >
              <SelectTrigger className="flex items-center text-left gap-2 text-sm border rounded-md bg-background hover:bg-muted transition-colors min-w-[200px] w-full">
                {isLoadingNamespaces ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <>
                    <LayoutGrid size={14} className="text-professional-purple-DEFAULT" />
                    <SelectValue placeholder="Select namespace" />
                  </>
                )}
              </SelectTrigger>
              <SelectContent align="start" className="text-left">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <GlassMorphicCard className="md:col-span-12">
          <div className="p-4 border-b bg-gradient-professional">
            <h3 className="font-medium text-sm">Namespace Issues</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Click on an issue to debug it
            </p>
          </div>
          
          <div className="p-3 min-h-[250px] max-h-[350px] overflow-auto bg-gradient-to-b from-muted/10 to-muted/30">
            {isLoadingIssues || debugLoading ? (
              <div className="flex justify-center items-center h-[250px]">
                <div className="w-6 h-6 border-2 border-professional-purple-DEFAULT border-t-transparent rounded-full animate-spin mr-2"></div>
                <span className="text-sm">{debugLoading ? "Processing debug request..." : "Loading issues..."}</span>
              </div>
            ) : namespaceIssues && namespaceIssues.length > 0 ? (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {namespaceIssues.map((issue) => (
                  <li 
                    key={issue.id} 
                    className="p-3 bg-background rounded-lg border border-border/30 shadow-sm hover:border-professional-purple-DEFAULT hover:bg-muted/30 transition-colors cursor-pointer group"
                    onClick={() => handleIssueClick(issue)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">{new Date(issue.timestamp).toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Kind</div>
                        <div className="text-sm font-medium">{issue.kind}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="text-sm truncate">{issue.name}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Message</div>
                        <div className="text-sm text-muted-foreground">{issue.message}</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs flex items-center gap-1 text-professional-purple-DEFAULT">
                        Debug issue <MessageSquare size={12} />
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-muted-foreground text-xs p-8 h-[250px] flex flex-col items-center justify-center">
                <Bug size={30} className="mx-auto mb-2 opacity-30" />
                <p>No issues found in this namespace</p>
                {selectedClusterArn && selectedNamespace && (
                  <p className="mt-2">The namespace appears to be healthy</p>
                )}
              </div>
            )}
          </div>
        </GlassMorphicCard>
      </div>

      <KubernetesDebugDrawer
        isOpen={isDebugDrawerOpen}
        onClose={closeDebugDrawer}
        debugSession={debugSession}
        issue={selectedIssue ? {
          ...selectedIssue,
          namespace: selectedNamespace
        } : undefined}
        debugFilePath={debugFilePath}
        s3FilePath={s3FilePath}
        isLoading={debugLoading}
      />
    </div>
  );
};

export default KubernetesDebugger;
