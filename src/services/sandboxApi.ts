
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

  // Chat with assistant for sandbox management
  chatWithAssistant: (message: string, sandboxId?: string) => 
    apiCall<ChatResponse>('/sandbox/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message,
        sandboxId 
      }),
    }),
};
