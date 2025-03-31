
import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Release, releaseApi } from '@/services/releaseApi';
import { useToast } from '@/hooks/use-toast';
import ReleaseChat from '@/components/release/ReleaseChat';
import ReleaseList from '@/components/release/ReleaseList';
import ReleaseDetails from '@/components/release/ReleaseDetails';

const ReleaseDeployment = () => {
  const { toast } = useToast();
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedRelease, setSelectedRelease] = useState<Release | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReleases = async () => {
    setIsLoading(true);
    try {
      const data = await releaseApi.getReleases();
      setReleases(data);
    } catch (error) {
      console.error('Error fetching releases:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch release information.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReleases();
  }, []);

  const handleReleaseSelect = (release: Release) => {
    setSelectedRelease(release);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Release Deployment Management</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Manage release deployments across different environments. Chat with the assistant to help with deployment tasks.
          </p>
        </div>

        <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full p-4">
              <h2 className="text-xl font-bold mb-4">Releases</h2>
              <ReleaseList 
                releases={releases}
                onSelectRelease={handleReleaseSelect}
                selectedReleaseId={selectedRelease?.id}
                isLoading={isLoading}
              />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={75}>
            <Card className="h-full rounded-none border-none">
              {selectedRelease ? (
                <ResizablePanelGroup direction="vertical" className="h-full">
                  <ResizablePanel defaultSize={50} className="overflow-auto">
                    <ReleaseDetails 
                      release={selectedRelease}
                      onReleaseUpdated={fetchReleases}
                    />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  <ResizablePanel defaultSize={50} className="h-full">
                    <div className="h-full">
                      <ReleaseChat 
                        onReleaseChange={fetchReleases}
                        selectedReleaseId={selectedRelease.id}
                      />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              ) : (
                <div className="h-full">
                  <ReleaseChat onReleaseChange={fetchReleases} />
                </div>
              )}
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Layout>
  );
};

export default ReleaseDeployment;
