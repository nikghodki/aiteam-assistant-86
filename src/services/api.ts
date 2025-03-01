// API base URL should be configured in your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Define interfaces for API responses
export interface UserAccess {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
}

export interface JiraTicket {
  key: string;
  url: string;
}

export interface AccessRequest {
  groupId: number;
  reason: string;
  userName: string;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface ChatResponse {
  response: string;
}

export interface DocumentResult {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  category: string;
}

export interface QueryHistoryItem {
  id: number;
  query: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface KubernetesCluster {
  id?: string;
  arn: string;
  name: string;
  status?: 'healthy' | 'warning' | 'error';
  version?: string;
  environment?: 'production' | 'qa' | 'staging';
  nodeCount?: number;
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

// Access Management API
export const accessApi = {
  // Get user groups
  getUserGroups: (userName: string) => 
    apiCall<any[]>('/access/groups', {
      method: 'POST',
      body: JSON.stringify({ userName }),
    }),

  // Request access to a group
  requestGroupAccess: (groupId: number, reason: string, userName: string) => 
    apiCall<JiraTicket>('/access/groups/request', {
      method: 'POST',
      body: JSON.stringify({ groupId, reason, userName }),
    }),

  // Leave a group
  leaveGroup: (groupName: string, userName: string) =>
    apiCall<{ success: boolean }>('/access/groups/leave', {
      method: 'POST',
      body: JSON.stringify({ groupName, userName }),
    }),

  // Chat with the assistant
  chatWithAssistant: (message: string, userName: string) => 
    apiCall<ChatResponse>('/access/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userName }),
    }),
};

// Documentation API
export const docsApi = {
  // Search documentation
  searchDocumentation: (query: string) => 
    apiCall<DocumentResult[]>('/docs/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  // Get document by ID
  getDocumentById: (id: number) => 
    apiCall<DocumentResult>(`/docs/${id}`),

  // Submit feedback on documentation
  submitFeedback: (documentId: number, helpful: boolean) => 
    apiCall<{success: boolean}>('/docs/feedback', {
      method: 'POST',
      body: JSON.stringify({ documentId, helpful }),
    }),

  // Chat with assistant
  chatWithAssistant: (message: string, context?: string[], history?: ChatMessage[]) => 
    apiCall<ChatResponse>('/docs/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        context, 
        history 
      }),
    }),

  // Get chat history
  getChatHistory: () => 
    apiCall<ChatMessage[]>('/docs/chat/history'),

  // Get query history
  getQueryHistory: () => 
    apiCall<QueryHistoryItem[]>('/docs/history'),

  // Clear chat history
  clearChatHistory: () => 
    apiCall<{success: boolean}>('/docs/chat/clear', {
      method: 'POST'
    }),
};

// Kubernetes Debugger API
export const kubernetesApi = {
  // Get clusters by environment
  getClusters: (environment?: 'production' | 'qa' | 'staging') => 
    apiCall<KubernetesCluster[]>(`/kubernetes/clusters${environment ? `?environment=${environment}` : ''}`),

  // Create a debugging session
  createSession: (cluster: string, description: string) => 
    apiCall<JiraTicket>('/kubernetes/session', {
      method: 'POST',
      body: JSON.stringify({ cluster, description }),
    }),

  // Run a kubectl command
  runCommand: (clusterArn: string, command: string, jiraTicketKey?: string) => 
    apiCall<CommandResult>('/kubernetes/command', {
      method: 'POST',
      body: JSON.stringify({ clusterArn, command, jiraTicketKey }),
    }),

  // Chat with the assistant
  chatWithAssistant: (clusterArn: string, message: string, jiraTicketKey?: string) => 
    apiCall<ChatResponse>('/kubernetes/chat', {
      method: 'POST',
      body: JSON.stringify({ clusterArn, message, jiraTicketKey }),
    }),

  // Get debugging sessions
  getDebugSessions: () => 
    apiCall<any[]>('/kubernetes/sessions'),

  // Get session details
  getSessionDetails: (sessionId: string) => 
    apiCall<any>(`/kubernetes/sessions/${sessionId}`),

  // Get cluster health
  getClusterHealth: (cluster: string) => 
    apiCall<any>(`/kubernetes/health/${cluster}`),
    
  // Download debug file
  downloadDebugFile: (sessionId: string) =>
    apiCall<{url: string}>(`/kubernetes/debug-file/${sessionId}`),
};

// Jira Ticket API
export const jiraApi = {
  // Create a ticket
  createTicket: (summary: string, description: string, priority: string = 'Medium') => 
    apiCall<JiraTicket>('/jira/ticket', {
      method: 'POST',
      body: JSON.stringify({ summary, description, priority }),
    }),

  // Get user's tickets
  getUserTickets: () => 
    apiCall<any[]>('/jira/tickets'),

  // Get ticket details
  getTicketDetails: (ticketKey: string) => 
    apiCall<any>(`/jira/tickets/${ticketKey}`),

  // Chat with assistant
  chatWithAssistant: (message: string) => 
    apiCall<ChatResponse>('/jira/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};

// Adding a function to get the mock user for demo purposes
export const getUserInfo = (): User => {
  return {
    id: '1',
    name: 'nghodki',
    email: 'nghodki@cisco.com',
  };
};
