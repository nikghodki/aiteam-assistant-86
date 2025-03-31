
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

const SandboxOrchestration = () => {
  const { toast } = useToast();
  const [sandboxes, setSandboxes] = useState<Sandbox[]>([]);
  const [selectedSandbox, setSelectedSandbox] = useState<Sandbox | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');

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
              <h2 className="text-xl font-bold mb-4">Sandboxes</h2>
              <SandboxList 
                sandboxes={sandboxes}
                onSandboxDelete={handleSandboxDelete}
                onSelectSandbox={handleSandboxSelect}
                selectedSandboxId={selectedSandbox?.id}
                isLoading={isLoading}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={75}>
            <Card className="h-full rounded-none border-none">
              {selectedSandbox ? (
                <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'details')} className="h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b">
                    <TabsList>
                      <TabsTrigger value="chat">Chat</TabsTrigger>
                      <TabsTrigger value="details">Sandbox Details</TabsTrigger>
                    </TabsList>
                    <div className="text-sm font-medium">
                      {selectedSandbox.name}
                    </div>
                  </div>
                  
                  <TabsContent value="chat" className="flex-1 overflow-hidden">
                    <SandboxChat 
                      onSandboxChange={fetchSandboxes}
                      selectedSandboxId={selectedSandbox.id}
                    />
                  </TabsContent>
                  
                  <TabsContent value="details" className="flex-1 overflow-auto p-0">
                    <SandboxDetails 
                      sandbox={selectedSandbox}
                      onSandboxUpdated={fetchSandboxes}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="h-full">
                  <SandboxChat onSandboxChange={fetchSandboxes} />
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
