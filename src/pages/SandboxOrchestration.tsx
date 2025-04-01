
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Sandbox, sandboxApi } from '@/services/sandboxApi';
import { useToast } from '@/hooks/use-toast';
import SandboxChat from '@/components/sandbox/SandboxChat';
import SandboxList from '@/components/sandbox/SandboxList';
import SandboxDetails from '@/components/sandbox/SandboxDetails';
import SandboxWorkflowDashboard from '@/components/sandbox/SandboxWorkflowDashboard';
import { Button } from '@/components/ui/button';
import { Grid, List, Activity } from 'lucide-react';
import SandboxTable from '@/components/sandbox/SandboxTable';

const SandboxOrchestration = () => {
  const { toast } = useToast();
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [selectedSandbox, setSelectedSandbox] = useState<Sandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'details' | 'workflow'>('chat');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [workflowActive, setWorkflowActive] = useState(false);
  const [creatingNewSandbox, setCreatingNewSandbox] = useState<string | null>(null);

  const fetchSandboxes = async () => {
    setIsLoading(true);
    try {
      const data = await sandboxApi.getSandboxes();
      setSandboxes(data);
    } catch (error) {
      console.error('Error fetching sandboxes:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch sandboxes.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSandboxes();
  }, []);

  const handleSandboxSelect = (sandbox: Sandbox) => {
    setSelectedSandbox(sandbox);
    setActiveTab('details');
  };

  const handleSandboxDelete = (id: string) => {
    setSandboxes(prev => prev.filter(sandbox => sandbox.id !== id));
    if (selectedSandbox && selectedSandbox.id === id) {
      setSelectedSandbox(null);
    }
  };

  const handleSandboxCreationStarted = (sandboxId: string) => {
    setCreatingNewSandbox(sandboxId);
    setWorkflowActive(true);
    setActiveTab('workflow');
  };

  const handleWorkflowComplete = () => {
    fetchSandboxes();
    setCreatingNewSandbox(null);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Sandbox Orchestration</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Create and manage sandboxes for development and testing. Chat with the assistant to easily create new environments.
          </p>
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Sandboxes</h2>
                <div className="flex space-x-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                  >
                    <Grid size={16} />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                  >
                    <List size={16} />
                  </Button>
                </div>
              </div>
              
              {viewMode === 'cards' ? (
                <SandboxList 
                  sandboxes={sandboxes}
                  onSandboxDelete={handleSandboxDelete}
                  onSelectSandbox={handleSandboxSelect}
                  selectedSandboxId={selectedSandbox?.id}
                  isLoading={isLoading}
                />
              ) : (
                <SandboxTable
                  sandboxes={sandboxes}
                  onSandboxDelete={handleSandboxDelete}
                  onSelectSandbox={handleSandboxSelect}
                  selectedSandboxId={selectedSandbox?.id}
                  isLoading={isLoading}
                />
              )}
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={75}>
            <Card className="h-full rounded-none border-none">
              {selectedSandbox ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'details' | 'workflow')} className="h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b">
                    <TabsList>
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                      <TabsTrigger value="details">Sandbox Details</TabsTrigger>
                      <TabsTrigger value="workflow" disabled={!workflowActive}>
                        <Activity className="h-4 w-4 mr-2" />
                        Workflow
                      </TabsTrigger>
                    </TabsList>
                    <div className="text-sm font-medium">
                      {selectedSandbox.name}
                    </div>
                  </div>
                  
                  <TabsContent value="chat" className="flex-1 overflow-hidden">
                    <SandboxChat 
                      onSandboxChange={fetchSandboxes}
                      selectedSandboxId={selectedSandbox.id}
                      onSandboxCreationStarted={handleSandboxCreationStarted}
                    />
                  </TabsContent>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto p-0">
                    <SandboxDetails 
                      sandbox={selectedSandbox}
                      onSandboxUpdated={fetchSandboxes}
                    />
                  </TabsContent>

                  <TabsContent value="workflow" className="flex-1 overflow-auto p-4">
                    <SandboxWorkflowDashboard
                      sandboxId={creatingNewSandbox || selectedSandbox.id}
                      onWorkflowComplete={handleWorkflowComplete}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-full">
                  <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'workflow')} className="h-full flex flex-col">
                    <div className="flex justify-between items-center p-4 border-b">
                      <TabsList>
                        <TabsTrigger value="chat">Chat</TabsTrigger>
                        <TabsTrigger value="workflow" disabled={!workflowActive}>
                          <Activity className="h-4 w-4 mr-2" />
                          Workflow
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="chat" className="flex-1 overflow-hidden">
                      <SandboxChat 
                        onSandboxChange={fetchSandboxes} 
                        onSandboxCreationStarted={handleSandboxCreationStarted}
                      />
                    </TabsContent>

                    <TabsContent value="workflow" className="flex-1 overflow-auto p-4">
                      <SandboxWorkflowDashboard
                        sandboxId={creatingNewSandbox}
                        onWorkflowComplete={handleWorkflowComplete}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
};

export default SandboxOrchestration;
