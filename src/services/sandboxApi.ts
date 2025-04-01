import { API_BASE_URL } from './api';

export interface Sandbox {
  id: string;
  name: string;
  status: 'stable' | 'initializing' | 'error' | 'terminating';
  createdAt: string;
  services: SandboxService[];
}

export interface SandboxService {
  name: string;
  image: string;
  status: 'running' | 'pending' | 'error';
  environmentVariables: { name: string; value: string }[];
}

export interface SandboxCreateRequest {
  name: string;
  services: {
    name: string;
    image: string;
    environmentVariables?: { name: string; value: string }[];
  }[];
}

export interface SandboxUpdateRequest {
  id: string;
  name?: string;
  services?: {
    name: string;
    image?: string;
    environmentVariables?: { name: string; value: string }[];
  }[];
}

export interface ChatResponse {
  response: string;
  actionTaken?: 'create' | 'update' | 'delete';
  sandbox?: Sandbox;
}

export interface WorkflowStatusResponse {
  sandboxId: string;
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    logs?: string;
    startTime?: string;
    endTime?: string;
  }[];
  currentStep: string;
  progress: number;
}

// Helper function for API calls
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  return response.json();
};

// For demo purposes, we'll simulate responses with more dynamic data
const simulateWorkflowResponse = (sandboxId: string): WorkflowStatusResponse => {
  // In a real implementation, this would be actual API data
  return {
    sandboxId,
    steps: [
      {
        id: 'namespace_creation',
        name: 'Namespace Creation',
        status: 'completed',
        logs: 'Namespace created successfully',
        startTime: new Date(Date.now() - 300000).toISOString(),
        endTime: new Date(Date.now() - 290000).toISOString()
      },
      {
        id: 'values_file_update',
        name: 'Values File Update',
        status: 'completed',
        logs: 'Values file updated successfully',
        startTime: new Date(Date.now() - 290000).toISOString(),
        endTime: new Date(Date.now() - 280000).toISOString()
      },
      {
        id: 'argo_deployment',
        name: 'Argo Deployment',
        status: 'in_progress',
        logs: 'Deploying common services...\nWaiting for pods to be ready...',
        startTime: new Date(Date.now() - 280000).toISOString(),
      },
      {
        id: 'argo_healthcheck',
        name: 'Argo Healthcheck',
        status: 'pending',
      },
      {
        id: 'product_deployment',
        name: 'Product Services Deployment',
        status: 'pending',
      },
      {
        id: 'product_healthcheck',
        name: 'Product Services Healthcheck',
        status: 'pending',
      },
      {
        id: 'tenant_creation',
        name: 'Tenant Creation',
        status: 'pending',
      },
      {
        id: 'tenant_onboarding',
        name: 'Tenant Onboarding',
        status: 'pending',
      },
      {
        id: 'data_fetch_trigger',
        name: 'Data Fetch Trigger',
        status: 'pending',
      }
    ],
    currentStep: 'argo_deployment',
    progress: 25
  };
};

export const sandboxApi = {
  // Get all sandboxes
  getSandboxes: () => 
    apiCall<Sandbox[]>('/sandbox'),

  // Get a specific sandbox by ID
  getSandbox: (id: string) => 
    apiCall<Sandbox>(`/sandbox/${id}`),

  // Create a new sandbox
  createSandbox: (sandbox: SandboxCreateRequest) => 
    apiCall<Sandbox>('/sandbox', {
      method: 'POST',
      body: JSON.stringify(sandbox),
    }),

  // Update an existing sandbox
  updateSandbox: (sandbox: SandboxUpdateRequest) => 
    apiCall<Sandbox>(`/sandbox/${sandbox.id}`, {
      method: 'PUT',
      body: JSON.stringify(sandbox),
    }),

  // Delete a sandbox
  deleteSandbox: (id: string) => 
    apiCall<{ success: boolean }>(`/sandbox/${id}`, {
      method: 'DELETE',
    }),

  // Get workflow status for a sandbox (for demo, we'll simulate the response)
  getWorkflowStatus: (sandboxId: string) => {
    // For demo, we'll return a simulated response
    // In real implementation, this would call the API
    return Promise.resolve(simulateWorkflowResponse(sandboxId));
  },

  // Get logs for a specific workflow step
  getStepLogs: (sandboxId: string, stepId: string) => 
    apiCall<{ logs: string }>(`/sandbox/${sandboxId}/workflow/step/${stepId}/logs`),

  // Retry a failed workflow step
  retryWorkflowStep: (sandboxId: string, stepId: string) => 
    apiCall<{ success: boolean }>(`/sandbox/${sandboxId}/workflow/step/${stepId}/retry`, {
      method: 'POST',
    }),

  // Chat with assistant for sandbox management
  chatWithAssistant: (message: string, sandboxId?: string) => 
    apiCall<ChatResponse>('/sandbox/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        sandboxId 
      }),
    }),

  // For demo purposes: simulate sandbox creation via chat
  simulateSandboxCreation: (message: string): Promise<ChatResponse> => {
    // This function simulates the response from the chat API when a user
    // asks to create a sandbox
    const newSandboxId = `demo-${Date.now()}`;
    
    // Check if the message contains keywords related to sandbox creation
    const isCreatingRequest = /create|new|start|launch|build|make|spin up/i.test(message) && 
                              /sandbox|environment|env|container/i.test(message);
    
    if (isCreatingRequest) {
      return Promise.resolve({
        response: "I've started creating a new sandbox environment for you. You can monitor the progress in the workflow dashboard.",
        actionTaken: 'create',
        sandbox: {
          id: newSandboxId,
          name: `demo-sandbox-${Math.floor(Math.random() * 1000)}`,
          status: 'initializing',
          createdAt: new Date().toISOString(),
          services: [
            {
              name: 'api-service',
              image: 'api:latest',
              status: 'pending',
              environmentVariables: []
            },
            {
              name: 'database',
              image: 'postgres:13',
              status: 'pending',
              environmentVariables: [
                { name: 'POSTGRES_USER', value: 'admin' },
                { name: 'POSTGRES_PASSWORD', value: '********' }
              ]
            }
          ]
        }
      });
    }
    
    // Regular response if not creating sandbox
    return Promise.resolve({
      response: "I'm your sandbox assistant. You can ask me to create a new sandbox by saying something like 'Create a new sandbox for the web team' or 'I need a testing environment'.",
    });
  }
};
