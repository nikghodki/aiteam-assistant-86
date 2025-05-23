import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  FileText,
  Terminal,
  ExternalLink,
  Bug
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sandboxApi, WorkflowStatusResponse } from '@/services/sandboxApi';

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  logs?: string;
  startTime?: Date;
  endTime?: Date;
  description: string;
}

interface SandboxWorkflowDashboardProps {
  sandboxId?: string;
  onWorkflowComplete?: () => void;
}

const SandboxWorkflowDashboard: React.FC<SandboxWorkflowDashboardProps> = ({ 
  sandboxId,
  onWorkflowComplete
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [workflowProgress, setWorkflowProgress] = useState(0);
  const [clusterName, setClusterName] = useState<string>('demo-cluster');
  const [namespace, setNamespace] = useState<string>('demo-namespace');
  const [showDebugToast, setShowDebugToast] = useState(false);
  const [failedStep, setFailedStep] = useState<WorkflowStep | null>(null);
  
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([
    {
      id: 'namespace_creation',
      name: 'Namespace Creation',
      status: 'pending',
      description: 'Creating Kubernetes namespace for the sandbox'
    },
    {
      id: 'values_file_update',
      name: 'Values File Update',
      status: 'pending',
      description: 'Updating Helm values file with sandbox configuration'
    },
    {
      id: 'argo_deployment',
      name: 'Argo Deployment',
      status: 'pending',
      description: 'Deploying common services using Argo CD'
    },
    {
      id: 'argo_healthcheck',
      name: 'Argo Healthcheck',
      status: 'pending',
      description: 'Validating health of common services'
    },
    {
      id: 'product_deployment',
      name: 'Product Services Deployment',
      status: 'pending',
      description: 'Deploying core product services'
    },
    {
      id: 'product_healthcheck',
      name: 'Product Services Healthcheck',
      status: 'pending',
      description: 'Validating health of product services'
    },
    {
      id: 'tenant_creation',
      name: 'Tenant Creation',
      status: 'pending',
      description: 'Creating tenant configuration'
    },
    {
      id: 'tenant_onboarding',
      name: 'Tenant Onboarding',
      status: 'pending',
      description: 'Provisioning tenant resources'
    },
    {
      id: 'data_fetch_trigger',
      name: 'Data Fetch Trigger',
      status: 'pending',
      description: 'Initializing data synchronization'
    }
  ]);

  const simulateWorkflowProgress = () => {
    if (!sandboxId || currentStepIndex >= workflowSteps.length) return;
    
    setIsLoading(true);
    
    const updatedSteps = [...workflowSteps];
    
    if (updatedSteps[currentStepIndex].status === 'pending') {
      updatedSteps[currentStepIndex] = {
        ...updatedSteps[currentStepIndex],
        status: 'in_progress',
        startTime: new Date(),
        logs: generateMockLogs(updatedSteps[currentStepIndex].name)
      };
      setWorkflowSteps(updatedSteps);
    }
    
    const shouldFail = updatedSteps[currentStepIndex].id === 'product_deployment';
    
    setTimeout(() => {
      const nextSteps = [...updatedSteps];
      
      if (!shouldFail) {
        nextSteps[currentStepIndex] = {
          ...nextSteps[currentStepIndex],
          status: 'completed',
          endTime: new Date(),
          logs: nextSteps[currentStepIndex].logs + '\nStep completed successfully.'
        };
        
        const newIndex = currentStepIndex + 1;
        setCurrentStepIndex(newIndex);
        
        const progress = Math.min(100, Math.round((newIndex / workflowSteps.length) * 100));
        setWorkflowProgress(progress);
        
        if (newIndex >= workflowSteps.length) {
          if (onWorkflowComplete) {
            onWorkflowComplete();
          }
          toast({
            title: "Sandbox Creation Complete",
            description: "All steps have been completed successfully.",
          });
        }
      } else {
        const errorLogs = 
          '\n[ERROR] Failed to deploy product services' +
          '\n[ERROR] Error code: DEPLOYMENT_TIMEOUT' +
          '\n[ERROR] Deployment failed with exit code 1' +
          '\n[ERROR] Service "api-gateway" failed to start' +
          '\n[ERROR] Container healthcheck failed after 5 attempts' +
          '\n[ERROR] Check container logs for more details';
        
        nextSteps[currentStepIndex] = {
          ...nextSteps[currentStepIndex],
          status: 'failed',
          endTime: new Date(),
          logs: nextSteps[currentStepIndex].logs + errorLogs
        };
        
        setFailedStep(nextSteps[currentStepIndex]);
        setShowDebugToast(true);
      }
      
      setWorkflowSteps(nextSteps);
      setIsLoading(false);
    }, 2000);
  };

  useEffect(() => {
    if (!sandboxId) return;
    
    let timeoutId: number;
    
    const runSimulation = () => {
      if (currentStepIndex < workflowSteps.length && 
          (currentStepIndex === 0 || workflowSteps[currentStepIndex - 1].status !== 'failed')) {
        simulateWorkflowProgress();
        
        timeoutId = window.setTimeout(runSimulation, 3000);
      }
    };
    
    runSimulation();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sandboxId, currentStepIndex]);

  const openLogDialog = (step: WorkflowStep) => {
    setSelectedStep(step);
    setIsLogDialogOpen(true);
  };

  const closeLogDialog = () => {
    setIsLogDialogOpen(false);
    setSelectedStep(null);
  };

  const navigateToDebugger = () => {
    if (!namespace || !clusterName) {
      toast({
        title: "Missing Information",
        description: "Cluster or namespace information is not available",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/kubernetes?cluster=${clusterName}&namespace=${namespace}`);
    closeLogDialog();
    setShowDebugToast(false);
  };

  const handleRetryStep = (stepId: string) => {
    const stepIndex = workflowSteps.findIndex(step => step.id === stepId);
    if (stepIndex === -1) return;
    
    const updatedSteps = [...workflowSteps];
    
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      status: 'pending',
      logs: generateMockLogs(updatedSteps[stepIndex].name) + '\nRetrying step...'
    };
    
    for (let i = stepIndex + 1; i < updatedSteps.length; i++) {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: 'pending',
        logs: undefined,
        startTime: undefined,
        endTime: undefined
      };
    }
    
    setWorkflowSteps(updatedSteps);
    setCurrentStepIndex(stepIndex);
    closeLogDialog();
    setShowDebugToast(false);
    
    toast({
      title: "Retrying Step",
      description: `Retrying "${updatedSteps[stepIndex].name}"`,
    });
  };

  const generateMockLogs = (stepName: string): string => {
    return `[${new Date().toISOString()}] Starting ${stepName}...\n` +
           `[${new Date().toISOString()}] Initializing ${stepName.toLowerCase()} process\n` +
           `[${new Date().toISOString()}] Running pre-checks for ${stepName.toLowerCase()}\n` +
           `[${new Date().toISOString()}] Executing ${stepName.toLowerCase()} operation\n`;
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  if (!sandboxId) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Sandbox Creation Workflow</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {workflowProgress}% Complete
          </span>
        </div>
      </div>
      
      <Progress value={workflowProgress} className="h-2" />
      
      <div className="space-y-2 mt-2">
        {workflowSteps.map((step, index) => (
          <div 
            key={step.id}
            className={cn(
              "flex items-center justify-between p-3 rounded-md border transition-colors",
              step.status === 'completed' && "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900",
              step.status === 'failed' && "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900",
              step.status === 'in_progress' && "border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900",
              step.status === 'pending' && "border-gray-200 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700"
            )}
          >
            <div className="flex items-center gap-3">
              {getStepStatusIcon(step.status)}
              <div>
                <div className="font-medium">{step.name}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {step.status === 'failed' && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                  onClick={() => openLogDialog(step)}
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  View Error
                </Button>
              )}
              
              {(step.status === 'completed' || step.status === 'in_progress') && (
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => openLogDialog(step)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Logs
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {showDebugToast && failedStep && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-black/90 shadow-xl rounded-lg border border-red-500 text-white p-4 animate-in slide-in-from-right">
          <div className="flex items-start mb-2">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
            <div>
              <h4 className="font-bold text-white">Failed: {failedStep.name}</h4>
              <p className="text-sm text-gray-300">Namespace: {namespace}</p>
            </div>
          </div>
          
          <p className="text-sm mb-4 text-gray-300">
            A critical error occurred during sandbox creation. Debug the issue directly in Kubernetes to resolve it.
          </p>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
              onClick={() => setShowDebugToast(false)}
            >
              Dismiss
            </Button>
            <Button 
              onClick={navigateToDebugger}
              size="sm"
              className="bg-professional-purple-DEFAULT hover:bg-professional-purple-dark text-white"
            >
              <Bug className="h-4 w-4 mr-2" />
              Debug in Kubernetes
              <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </div>
      )}
      
      <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStep && getStepStatusIcon(selectedStep.status)}
              {selectedStep?.name} Logs
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-4">
            <div className="p-4 bg-black rounded-md">
              <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap max-h-[50vh] overflow-auto">
                {selectedStep?.logs || "No logs available"}
              </pre>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center gap-2">
            <div className="flex-1">
              {selectedStep?.status === 'failed' && (
                <div className="text-sm font-medium text-red-600">
                  This step has failed. You can retry the step or debug the issue in Kubernetes Debugger.
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={closeLogDialog}>
                Close
              </Button>
              
              {selectedStep?.status === 'failed' && (
                <>
                  <Button 
                    variant="outline"
                    className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => selectedStep && handleRetryStep(selectedStep.id)}
                  >
                    Retry Step
                  </Button>
                  
                  <Button 
                    onClick={navigateToDebugger}
                    className="bg-professional-purple-DEFAULT hover:bg-professional-purple-dark text-white"
                  >
                    <Terminal className="h-4 w-4 mr-2" />
                    Debug in Kubernetes
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SandboxWorkflowDashboard;
