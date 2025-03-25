
import { apiCall } from './api';

// Types for release API
export interface Release {
  id: string;
  name: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'failed';
  scheduledTime: string;
  completedTime?: string;
  environments: string[];
}

export interface ReleaseChatResponse {
  message: string;
  actionPerformed?: boolean;
  actionSummary?: string;
}

export interface ReleaseCreateData {
  name: string;
  scheduledTime: string;
  environments: string[];
}

// Release API functions
export const getReleases = (): Promise<Release[]> => {
  return apiCall('/release/list', { method: 'GET' });
};

export const getReleaseById = (id: string): Promise<Release> => {
  return apiCall(`/release/${id}`, { method: 'GET' });
};

export const createRelease = (data: ReleaseCreateData): Promise<Release> => {
  return apiCall('/release/create', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateRelease = (id: string, data: Partial<ReleaseCreateData>): Promise<Release> => {
  return apiCall(`/release/${id}/update`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const cancelRelease = (id: string): Promise<{ success: boolean }> => {
  return apiCall(`/release/${id}/cancel`, { method: 'POST' });
};

export const startRelease = (id: string): Promise<Release> => {
  return apiCall(`/release/${id}/start`, { method: 'POST' });
};

export const chatWithReleaseAssistant = (message: string): Promise<ReleaseChatResponse> => {
  return apiCall('/release/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
};
