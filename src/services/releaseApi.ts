
import { API_BASE_URL } from './api';

export interface Release {
  id: string;
  name: string;
  version: string;
  status: 'planned' | 'in-progress' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  environments: string[];
}

export interface DeploymentStep {
  id: string;
  releaseId: string;
  environment: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  logs?: string[];
}

export interface ReleaseCreateRequest {
  name: string;
  version: string;
  environments: string[];
}

export interface ChatResponse {
  response: string;
  actionTaken?: 'create' | 'deploy' | 'rollback';
  release?: Release;
  deploymentStep?: DeploymentStep;
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

export const releaseApi = {
  // Get all releases
  getReleases: () => 
    apiCall<Release[]>('/releases'),

  // Get a specific release by ID
  getRelease: (id: string) => 
    apiCall<Release>(`/releases/${id}`),

  // Create a new release
  createRelease: (release: ReleaseCreateRequest) => 
    apiCall<Release>('/releases', {
      method: 'POST',
      body: JSON.stringify(release),
    }),

  // Get deployment steps for a release
  getDeploymentSteps: (releaseId: string) => 
    apiCall<DeploymentStep[]>(`/releases/${releaseId}/deployments`),

  // Deploy a release to an environment
  deployToEnvironment: (releaseId: string, environment: string) => 
    apiCall<DeploymentStep>(`/releases/${releaseId}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ environment }),
    }),

  // Rollback a deployment
  rollbackDeployment: (releaseId: string, environment: string) => 
    apiCall<DeploymentStep>(`/releases/${releaseId}/rollback`, {
      method: 'POST',
      body: JSON.stringify({ environment }),
    }),

  // Chat with assistant for release management
  chatWithAssistant: (message: string, releaseId?: string) => 
    apiCall<ChatResponse>('/releases/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        releaseId 
      }),
    }),

  // Get deployment logs
  getDeploymentLogs: (deploymentId: string) => 
    apiCall<string[]>(`/deployments/${deploymentId}/logs`),
};
