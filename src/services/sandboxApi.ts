
import { apiCall } from './api';

// Types for sandbox API
export interface Sandbox {
  id: string;
  name: string;
  status: 'stable' | 'provisioning' | 'error' | 'deleting';
  createdAt: string;
  services: Array<{
    name: string;
    imageTag: string;
    envVariables: Record<string, string>;
  }>;
}

export interface SandboxChatResponse {
  message: string;
  sandboxCreated?: boolean;
  sandboxModified?: boolean;
  sandboxId?: string;
}

export interface SandboxUpdateData {
  name: string;
  services: Array<{
    name: string;
    imageTag: string;
    envVariables: Record<string, string>;
  }>;
}

// Sandbox API functions
export const getSandboxes = (): Promise<Sandbox[]> => {
  return apiCall('/sandbox/list', { method: 'GET' });
};

export const getSandboxById = (id: string): Promise<Sandbox> => {
  return apiCall(`/sandbox/${id}`, { method: 'GET' });
};

export const createSandbox = (data: SandboxUpdateData): Promise<Sandbox> => {
  return apiCall('/sandbox/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateSandbox = (id: string, data: SandboxUpdateData): Promise<Sandbox> => {
  return apiCall(`/sandbox/${id}/update`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteSandbox = (id: string): Promise<{ success: boolean }> => {
  return apiCall(`/sandbox/${id}/delete`, { method: 'DELETE' });
};

export const refreshSandbox = (id: string): Promise<Sandbox> => {
  return apiCall(`/sandbox/${id}/refresh`, { method: 'POST' });
};

export const chatWithSandboxAssistant = (message: string): Promise<SandboxChatResponse> => {
  return apiCall('/sandbox/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};
