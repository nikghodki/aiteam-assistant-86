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
  summary?: string;
  description?: string;
  status?: string;
  priority?: string;
  created?: string;
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

// RBAC interfaces
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  resource: 'access' | 'kubernetes' | 'documentation' | 'jira' | 'settings' | 'all';
  action: 'read' | 'write' | 'admin' | 'all';
}

export interface UserRole {
  userId: string;
  roleId: string;
  roleName: string;
}

export interface UserPermission {
  userId: string;
  permission: Permission;
}

// OIDC interfaces
export interface OIDCConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export interface OIDCAuthResult {
  success: boolean;
  user?: User;
  error?: string;
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

// RBAC API
export const rbacApi = {
  // Roles management
  getRoles: () => 
    apiCall<Role[]>('/rbac/roles'),

  getRole: (roleId: string) => 
    apiCall<Role>(`/rbac/roles/${roleId}`),

  createRole: (role: Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>) => 
    apiCall<Role>('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(role),
    }),

  updateRole: (roleId: string, role: Partial<Omit<Role, 'id' | 'isSystem' | 'createdAt' | 'updatedAt'>>) => 
    apiCall<Role>(`/rbac/roles/${roleId}`, {
      method: 'PUT',
      body: JSON.stringify(role),
    }),

  deleteRole: (roleId: string) => 
    apiCall<{ success: boolean }>(`/rbac/roles/${roleId}`, {
      method: 'DELETE',
    }),

  // User roles management
  getUserRoles: (userId: string) => 
    apiCall<UserRole[]>(`/rbac/users/${userId}/roles`),

  assignRoleToUser: (userId: string, roleId: string) => 
    apiCall<{ success: boolean }>(`/rbac/users/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleId }),
    }),

  removeRoleFromUser: (userId: string, roleId: string) => 
    apiCall<{ success: boolean }>(`/rbac/users/${userId}/roles/${roleId}`, {
      method: 'DELETE',
    }),

  // User permissions management
  getUserPermissions: (userId: string) => 
    apiCall<Permission[]>(`/rbac/users/${userId}/permissions`),

  assignPermissionToUser: (userId: string, permission: Omit<Permission, 'id'>) => 
    apiCall<{ success: boolean }>(`/rbac/users/${userId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ permission }),
    }),

  removePermissionFromUser: (userId: string, permissionId: string) => 
    apiCall<{ success: boolean }>(`/rbac/users/${userId}/permissions/${permissionId}`, {
      method: 'DELETE',
    }),
};

// OIDC Authentication API
export const oidcApi = {
  // Save OIDC configuration
  saveConfig: (provider: string, config: OIDCConfig) => 
    apiCall<{ success: boolean }>('/oidc/config', {
      method: 'POST',
      body: JSON.stringify({ provider, config }),
    }),

  // Get OIDC configuration
  getConfig: (provider: string) => 
    apiCall<OIDCConfig>(`/oidc/config/${provider}`),

  // Process OIDC callback
  processCallback: (provider: string, code: string, state: string) => 
    apiCall<OIDCAuthResult>('/oidc/callback', {
      method: 'POST',
      body: JSON.stringify({ provider, code, state }),
    }),

  // List available providers
  listProviders: () => 
    apiCall<string[]>('/oidc/providers'),
};

// Getting the mock user for demo purposes
export const getUserInfo = (): User => {
  return {
    id: '1',
    name: 'nghodki',
    email: 'nghodki@cisco.com',
  };
};
