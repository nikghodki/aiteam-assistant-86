
import { useState, useEffect } from 'react';
import { Release, DeploymentStep, releaseApi } from '@/services/releaseApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle, Clock, AlertCircle, ArrowDownToLine, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReleaseDetailsProps {
  release: Release;
  onReleaseUpdated: () => void;
}

const ReleaseDetails: React.FC<ReleaseDetailsProps> = ({ release, onReleaseUpdated }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [deployments, setDeployments] = useState<DeploymentStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentStep | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  useEffect(() => {
    if (release) {
      loadDeploymentSteps();
    }
  }, [release]);

  const loadDeploymentSteps = async () => {
    setLoading(true);
    try {
      const steps = await releaseApi.getDeploymentSteps(release.id);
      setDeployments(steps);
      if (steps.length > 0 && !selectedDeployment) {
        setSelectedDeployment(steps[0]);
        loadDeploymentLogs(steps[0].id);
      }
    } catch (error) {
      console.error('Error loading deployment steps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deployment information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDeploymentLogs = async (deploymentId: string) => {
    try {
      const logs = await releaseApi.getDeploymentLogs(deploymentId);
      setDeploymentLogs(logs);
    } catch (error) {
      console.error('Error loading deployment logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deployment logs',
        variant: 'destructive',
      });
    }
  };

  const handleDeployToEnvironment = async (environment: string) => {
    try {
      await releaseApi.deployToEnvironment(release.id, environment);
      toast({
        title: 'Deployment Initiated',
        description: `Deployment to ${environment} has been initiated`,
      });
      loadDeploymentSteps();
      onReleaseUpdated();
    } catch (error) {
      console.error('Error deploying to environment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate deployment',
        variant: 'destructive',
      });
    }
  };

  const handleRollback = async (environment: string) => {
    try {
      await releaseApi.rollbackDeployment(release.id, environment);
      toast({
        title: 'Rollback Initiated',
        description: `Rollback for ${environment} has been initiated`,
      });
      loadDeploymentSteps();
      onReleaseUpdated();
    } catch (error) {
      console.error('Error rolling back deployment:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate rollback',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: DeploymentStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{release.name}</h2>
          <p className="text-sm text-muted-foreground">Version {release.version}</p>
        </div>
        <Badge
          className={cn(
            "uppercase",
            release.status === 'planned' ? "bg-blue-100 text-blue-800" :
            release.status === 'in-progress' ? "bg-yellow-100 text-yellow-800" :
            release.status === 'completed' ? "bg-green-100 text-green-800" :
            "bg-red-100 text-red-800"
          )}
        >
          {release.status}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="deployments" className="flex-1">Deployments</TabsTrigger>
          <TabsTrigger value="logs" className="flex-1">Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Release Details</CardTitle>
              <CardDescription>Information about this release</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium">Release ID</div>
                <div className="text-sm text-muted-foreground">{release.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Created At</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(release.createdAt).toLocaleDateString()} {new Date(release.createdAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Last Updated</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(release.updatedAt).toLocaleDateString()} {new Date(release.updatedAt).toLocaleTimeString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Target Environments</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {release.environments.map((env, i) => (
                    <Badge key={i} variant="outline">{env}</Badge>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Deploy to Environment</h4>
                <div className="flex flex-wrap gap-2">
                  {release.environments.map((env, i) => (
                    <Button 
                      key={i} 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => handleDeployToEnvironment(env)}
                      disabled={release.status === 'completed'}
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-1" />
                      Deploy to {env}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deployments" className="py-4">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-professional-purple border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {deployments.length === 0 ? (
                <Card className="border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <p className="text-lg text-center text-muted-foreground">No deployments for this release yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <Card key={deployment.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-md">Environment: {deployment.environment}</CardTitle>
                            <CardDescription>
                              {deployment.startedAt ? 
                                `Started: ${new Date(deployment.startedAt).toLocaleString()}` : 
                                'Not started yet'}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.status)}
                            <Badge
                              className={cn(
                                "uppercase text-xs font-medium",
                                deployment.status === 'completed' ? "bg-green-100 text-green-800" :
                                deployment.status === 'in-progress' ? "bg-yellow-100 text-yellow-800" :
                                deployment.status === 'pending' ? "bg-blue-100 text-blue-800" :
                                "bg-red-100 text-red-800"
                              )}
                            >
                              {deployment.status}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {(deployment.status === 'in-progress' || deployment.status === 'completed') && (
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center"
                              onClick={() => handleRollback(deployment.environment)}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Rollback
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        <TabsContent value="logs" className="py-4">
          <div className="mb-4">
            <label className="text-sm font-medium block mb-2">Select Deployment</label>
            <select 
              className="w-full p-2 border rounded-md bg-background"
              value={selectedDeployment?.id || ''}
              onChange={(e) => {
                const deployment = deployments.find(d => d.id === e.target.value);
                if (deployment) {
                  setSelectedDeployment(deployment);
                  loadDeploymentLogs(deployment.id);
                }
              }}
            >
              {deployments.map(deployment => (
                <option key={deployment.id} value={deployment.id}>
                  {deployment.environment} - {deployment.status}
                </option>
              ))}
            </select>
          </div>
          
          {selectedDeployment ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Deployment Logs</CardTitle>
                <CardDescription>
                  Environment: {selectedDeployment.environment} | Status: {selectedDeployment.status}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] w-full rounded-md border p-4 bg-black text-gray-300 font-mono text-sm">
                  {deploymentLogs.length === 0 ? (
                    <p>No logs available for this deployment.</p>
                  ) : (
                    <div className="space-y-1">
                      {deploymentLogs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap">{log}</div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <p className="text-lg text-center text-muted-foreground">Select a deployment to view logs</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReleaseDetails;
