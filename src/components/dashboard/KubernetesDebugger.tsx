import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Send, Terminal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { kubernetesApi } from '@/services/api';
import { Textarea } from '@/components/ui/textarea';
import KubernetesDebugDrawer from './KubernetesDebugDrawer';
import { useQuery } from '@tanstack/react-query';

const KubernetesDebugger = () => {
  const { toast } = useToast();
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [chatMessage, setChatMessage] = useState<string>('');
  const [debuggerOpen, setDebuggerOpen] = useState<boolean>(false);
  const [currentIssue, setCurrentIssue] = useState<any>(null);
  const [debugSession, setDebugSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [debugFilePath, setDebugFilePath] = useState<string | undefined>(undefined);

  // Fetch clusters data
  const { data: clusters = [] } = useQuery({
    queryKey: ['kubernetes', 'clusters'],
    queryFn: async () => {
      try {
        const response = await kubernetesApi.getClusters();
        return response || [];
      } catch (error) {
        console.error('Error fetching clusters:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch Kubernetes clusters',
          variant: 'destructive',
        });
        return [];
      }
    },
  });

  // Fetch namespaces data when a cluster is selected
  const { data: namespaces = [], refetch: refetchNamespaces } = useQuery({
    queryKey: ['kubernetes', 'namespaces', selectedCluster],
    enabled: !!selectedCluster,
    queryFn: async () => {
      try {
        const response = await kubernetesApi.getNamespaces(selectedCluster);
        return response || [];
      } catch (error) {
        console.error('Error fetching namespaces:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch namespaces',
          variant: 'destructive',
        });
        return [];
      }
    },
  });

  // Fetch namespace issues when a namespace is selected
  const { data: namespaceIssues = [], refetch: refetchIssues } = useQuery({
    queryKey: ['kubernetes', 'issues', selectedNamespace],
    enabled: !!selectedNamespace,
    queryFn: async () => {
      if (!selectedNamespace) return [];
      
      try {
        const response = await kubernetesApi.getNamespaceIssues(selectedNamespace);
        return response || [];
      } catch (error) {
        console.error('Error fetching namespace issues:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch namespace issues',
          variant: 'destructive',
        });
        return [];
      }
    },
  });

  const handleClusterChange = (value: string) => {
    setSelectedCluster(value);
    setSelectedNamespace('');
    refetchNamespaces();
  };

  const handleNamespaceChange = (value: string) => {
    setSelectedNamespace(value);
    refetchIssues();
  };

  const handleIssueSelect = (issue: any) => {
    setCurrentIssue(issue);
    setDebugSession(null);
    setDebugFilePath(undefined);
    setDebuggerOpen(true);
    setIsLoading(true);
    
    setTimeout(() => {
      // Simulate getting debug information
      setIsLoading(false);
      // Add any additional logic to fetch debug info if needed
    }, 1500);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;
    
    setDebuggerOpen(true);
    setIsLoading(true);
    
    try {
      const response = await kubernetesApi.chatWithAssistant(chatMessage);
      
      console.log('Chat response:', response);
      
      // Check if the response contains a file path (either directly or within the response text)
      let filePath = response.filePath;
      if (!filePath && response.response) {
        // Try to extract file path from response text using regex patterns
        const s3Match = response.response.match(/s3:\/\/([^"\s]+)/);
        const urlMatch = response.response.match(/https?:\/\/[^"\s]+\.(?:log|txt|yaml|json|md)/);
        
        if (s3Match) {
          filePath = s3Match[0]; // This will be something like s3://bucket-name/path/to/file.txt
        } else if (urlMatch) {
          filePath = urlMatch[0]; // This will be a URL to a file
        }
      }
      
      // If file path is found, set it so the drawer can fetch the file
      if (filePath) {
        console.log('Found file path in response:', filePath);
        setDebugFilePath(filePath);
      }
      
      const sessionId = response.sessionId || `session-${Date.now()}`;
      
      setDebugSession({
        id: sessionId,
        debugLog: `## Request\n${chatMessage}\n\n## Response\n${response.response || ''}`,
      });
      
    } catch (error) {
      console.error('Error in chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the Kubernetes assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setChatMessage('');
    }
  };

  const closeDebugger = () => {
    setDebuggerOpen(false);
    setCurrentIssue(null);
    setDebugSession(null);
    setDebugFilePath(undefined);
  };

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="issues" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="assistant">Kubernetes Assistant</TabsTrigger>
          </TabsList>
          
          <TabsContent value="issues">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="cluster" className="text-sm font-medium block mb-1">
                  Select Cluster
                </label>
                <Select value={selectedCluster} onValueChange={handleClusterChange}>
                  <SelectTrigger id="cluster">
                    <SelectValue placeholder="Select cluster" />
                  </SelectTrigger>
                  <SelectContent>
                    {clusters.map((cluster: any) => (
                      <SelectItem key={cluster.name} value={cluster.name}>
                        {cluster.name} ({cluster.environment})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="namespace" className="text-sm font-medium block mb-1">
                  Select Namespace
                </label>
                <Select 
                  value={selectedNamespace} 
                  onValueChange={handleNamespaceChange}
                  disabled={!selectedCluster}
                >
                  <SelectTrigger id="namespace">
                    <SelectValue placeholder={selectedCluster ? "Select namespace" : "Select cluster first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {namespaces.map((namespace: string) => (
                      <SelectItem key={namespace} value={namespace}>
                        {namespace}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {selectedNamespace ? (
              namespaceIssues.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Issues in {selectedNamespace}</h3>
                  {namespaceIssues.map((issue: any, index: number) => (
                    <Card key={index} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleIssueSelect(issue)}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{issue.kind}: {issue.name}</h4>
                          <p className="text-sm text-muted-foreground">{issue.issue}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No issues found in this namespace.</p>
                </div>
              )
            ) : (
              <div className="p-6 text-center">
                <p className="text-muted-foreground">Select a cluster and namespace to view issues.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="assistant">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">
                  Kubernetes Assistant
                </label>
                <p className="text-sm text-muted-foreground mb-4">
                  Ask questions about your Kubernetes clusters or get help with troubleshooting.
                </p>
                
                <form onSubmit={handleChatSubmit} className="space-y-4">
                  <Textarea 
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    placeholder="Describe your Kubernetes issue or ask a question..."
                    className="min-h-[120px]"
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-professional-blue-light to-professional-purple-light hover:from-professional-blue-DEFAULT hover:to-professional-purple-DEFAULT"
                      disabled={!chatMessage.trim() || isLoading}
                    >
                      {isLoading ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
              
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">Sample Questions</h3>
                <div className="space-y-2">
                  <div 
                    className="text-xs p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                    onClick={() => setChatMessage("Why is my pod in CrashLoopBackOff state?")}
                  >
                    <Terminal className="inline-block w-3 h-3 mr-1" /> Why is my pod in CrashLoopBackOff state?
                  </div>
                  <div 
                    className="text-xs p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                    onClick={() => setChatMessage("How do I debug a failing Kubernetes service?")}
                  >
                    <Terminal className="inline-block w-3 h-3 mr-1" /> How do I debug a failing Kubernetes service?
                  </div>
                  <div 
                    className="text-xs p-2 bg-muted rounded-md cursor-pointer hover:bg-muted/80"
                    onClick={() => setChatMessage("Show me the best practices for Kubernetes resource management.")}
                  >
                    <Terminal className="inline-block w-3 h-3 mr-1" /> Show me the best practices for Kubernetes resource management.
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <KubernetesDebugDrawer 
        isOpen={debuggerOpen} 
        onClose={closeDebugger} 
        debugSession={debugSession}
        issue={currentIssue}
        debugFilePath={debugFilePath}
        isLoading={isLoading}
      />
    </>
  );
};

export default KubernetesDebugger;
