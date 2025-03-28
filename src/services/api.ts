// API base URL should be configured in your environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Import our auth hook to get JWT tokens
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces for API responses
export interface UserAccess {
  id: number;
  name: string;
  role: string;
  avatar?: string;
}

// Import AuthTokens interface
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
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
  reporter?: string;
  project?: string;
  issueType?: string;
}

export interface AccessRequest {
  groupId: number;
  reason: string;
  userEmail: string;
}

export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface ChatResponse {
  response: string;
  file_name?: string;
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

// Enhanced Jira ticket interfaces
export interface JiraTicketCreateRequest {
  summary: string;
  description: string;
  priority?: string;
  project?: string;
  issueType?: string;
}

export interface JiraProject {
  id: string;
  key: string;
  name: string;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
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
  tokens?: AuthTokens;
  error?: string;
}

// New interface for namespace issues
export interface NamespaceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  kind: string;
  name: string;
  message: string;
  timestamp: string;
}

// Sandbox orchestration interfaces
export interface Sandbox {
  id: string;
  name: string;
  description?: string;
  status: 'creating' | 'running' | 'failing' | 'stopped';
  services: SandboxService[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface SandboxService {
  id: string;
  sandboxId: string;
  name: string;
  image: string;
  tag: string;
  status: 'running' | 'failing' | 'stopped';
  environmentVariables: Record<string, string>;
  port?: number;
}

export interface CreateSandboxRequest {
  name: string;
  description?: string;
  services: Omit<SandboxService, 'id' | 'sandboxId' | 'status'>[];
}

export interface UpdateSandboxRequest {
  name?: string;
  description?: string;
}

export interface SandboxServiceUpdate {
  image?: string;
  tag?: string;
  environmentVariables?: Record<string, string>;
}

// Release deployment interfaces
export interface Release {
  id: string;
  name: string;
  version: string;
  status: 'planned' | 'in-progress' | 'deployed' | 'failed' | 'rolled-back';
  environment: 'dev' | 'staging' | 'production';
  scheduledDate: string;
  deployedDate?: string;
  events: ReleaseEvent[];
}

export interface ReleaseEvent {
  id: string;
  releaseId: string;
  type: 'deployment' | 'rollback' | 'validation' | 'approval';
  status: 'success' | 'failure' | 'in-progress' | 'pending';
  description: string;
  timestamp: string;
}

export interface CreateReleaseRequest {
  name: string;
  version: string;
  environment: 'dev' | 'staging' | 'production';
  scheduledDate: string;
}

export interface UpdateReleaseRequest {
  status?: 'planned' | 'in-progress' | 'deployed' | 'failed' | 'rolled-back';
  scheduledDate?: string;
}

// Helper function for API calls with JWT authentication
const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get the auth header with JWT token
  let authHeader = {};
  
  // Try to get the token from localStorage as a fallback
  // This is needed because we can't use the useAuth hook directly in this function
  try {
    const tokenString = localStorage.getItem('auth_tokens');
    if (tokenString) {
      const tokens = JSON.parse(tokenString);
      if (tokens && tokens.accessToken) {
        authHeader = { Authorization: `Bearer ${tokens.accessToken}` };
      }
    }
  } catch (e) {
    console.error('Error retrieving auth token:', e);
  }
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...authHeader
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

// Export a custom hook that includes the auth token
export const useApiWithAuth = () => {
  const { getAuthHeader } = useAuth();
  
  const apiCallWithAuth = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const authHeader = getAuthHeader();
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...authHeader
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
  
  return { apiCallWithAuth };
};

// Access Management API
export const accessApi = {
  // Get user groups
  getUserGroups: (userEmail: string) => 
    apiCall<any[]>('/access/groups', {
      method: 'POST',
      body: JSON.stringify({ userEmail }),
    }),

  // Request access to a group
  requestGroupAccess: (groupId: number, reason: string, userEmail: string) => 
    apiCall<JiraTicket>('/access/groups/request', {
      method: 'POST',
      body: JSON.stringify({ groupId, reason, userEmail }),
    }),

  // Leave a group
  leaveGroup: (groupName: string, userEmail: string) =>
    apiCall<{ success: boolean }>('/access/groups/leave', {
      method: 'POST',
      body: JSON.stringify({ groupName, userEmail }),
    }),

  // Chat with the assistant
  chatWithAssistant: (message: string, userEmail: string) => 
    apiCall<ChatResponse>('/access/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userEmail }),
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
  runCommand: (clusterArn: string, command: string, namespace: string, jiraTicketKey?: string) => 
    apiCall<CommandResult>('/kubernetes/command', {
      method: 'POST',
      body: JSON.stringify({ 
        clusterArn, 
        command, 
        namespace, 
        jiraTicketKey 
      }),
    }),

  // Chat with the assistant - updated to include namespace and removed jiraTicketKey
  chatWithAssistant: (clusterArn: string, message: string, namespace: string) => 
    apiCall<ChatResponse>('/kubernetes/chat', {
      method: 'POST',
      body: JSON.stringify({ clusterArn, message, namespace }),
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

  /**
   * Get namespaces for a Kubernetes cluster
   * @param clusterArn The ARN of the cluster
   * @returns An array of namespace names
   */
  getNamespaces: (clusterArn: string): Promise<string[]> => {
    // The clusterArn is required
    if (!clusterArn) {
      return Promise.reject(new Error('Cluster ARN is required'));
    }
    
    return apiCall<string[]>(`/kubernetes/namespaces`, {
      method: 'POST',
      body: JSON.stringify({ clusterArn }),
    });
  },

  /**
   * Get issues in a namespace
   * @param clusterArn The ARN of the cluster
   * @param namespace The namespace to check for issues
   * @returns An array of issues found in the namespace
   */
  getNamespaceIssues: (clusterArn: string, namespace: string): Promise<NamespaceIssue[]> => {
    if (!clusterArn) {
      return Promise.reject(new Error('Cluster ARN is required'));
    }
    if (!namespace) {
      return Promise.reject(new Error('Namespace is required'));
    }
    
    return apiCall<NamespaceIssue[]>(`/kubernetes/namespace-issues`, {
      method: 'POST',
      body: JSON.stringify({ clusterArn, namespace }),
    });
  }
};

// Enhanced Jira Ticket API
export const jiraApi = {
  // Create a ticket with more detailed fields
  createTicket: (ticketData: JiraTicketCreateRequest) => 
    apiCall<JiraTicket>('/jira/ticket', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),

  // Get user's tickets with optional filters
  getUserTickets: (filters?: { reporter?: string, status?: string }) => 
    apiCall<JiraTicket[]>(`/jira/tickets${filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : ''}`),
  
  // Get tickets reported by the current user
  getUserReportedTickets: () => 
    apiCall<JiraTicket[]>('/jira/tickets/reported-by-me'),

  // Get ticket details
  getTicketDetails: (ticketKey: string) => 
    apiCall<JiraTicket>(`/jira/tickets/${ticketKey}`),

  // Get available Jira projects
  getProjects: () => 
    apiCall<JiraProject[]>('/jira/projects'),

  // Get issue types for a project
  getIssueTypes: (projectId?: string) => 
    apiCall<JiraIssueType[]>(`/jira/issue-types${projectId ? `?projectId=${projectId}` : ''}`),

  // Chat with assistant for Jira
  chatWithAssistant: (message: string, context?: { ticketKey?: string }) => 
    apiCall<ChatResponse>('/jira/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
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

// Sandbox Orchestration API
export const sandboxApi = {
  // Get all sandboxes for the current user
  getSandboxes: () => 
    apiCall<Sandbox[]>('/sandbox/list'),

  // Get details for a specific sandbox
  getSandboxDetails: (sandboxId: string) => 
    apiCall<Sandbox>(`/sandbox/${sandboxId}`),

  // Create a new sandbox
  createSandbox: (data: CreateSandboxRequest) => 
    apiCall<Sandbox>('/sandbox/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update sandbox details
  updateSandbox: (sandboxId: string, data: UpdateSandboxRequest) => 
    apiCall<Sandbox>(`/sandbox/${sandboxId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete a sandbox
  deleteSandbox: (sandboxId: string) => 
    apiCall<{ success: boolean }>(`/sandbox/${sandboxId}`, {
      method: 'DELETE',
    }),

  // Start a sandbox
  startSandbox: (sandboxId: string) => 
    apiCall<Sandbox>(`/sandbox/${sandboxId}/start`, {
      method: 'POST',
    }),

  // Stop a sandbox
  stopSandbox: (sandboxId: string) => 
    apiCall<Sandbox>(`/sandbox/${sandboxId}/stop`, {
      method: 'POST',
    }),

  // Add a service to a sandbox
  addService: (sandboxId: string, service: Omit<SandboxService, 'id' | 'sandboxId' | 'status'>) => 
    apiCall<SandboxService>(`/sandbox/${sandboxId}/service`, {
      method: 'POST',
      body: JSON.stringify(service),
    }),

  // Update a service in a sandbox
  updateService: (sandboxId: string, serviceId: string, updates: SandboxServiceUpdate) => 
    apiCall<SandboxService>(`/sandbox/${sandboxId}/service/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Remove a service from a sandbox
  removeService: (sandboxId: string, serviceId: string) => 
    apiCall<{ success: boolean }>(`/sandbox/${sandboxId}/service/${serviceId}`, {
      method: 'DELETE',
    }),

  // Chat with assistant about sandbox orchestration
  chatWithAssistant: (message: string, context?: { sandboxId?: string }) => 
    apiCall<ChatResponse>('/sandbox/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

// Release Deployment API
export const releaseApi = {
  // Get all releases
  getReleases: (environment?: 'dev' | 'staging' | 'production') => 
    apiCall<Release[]>(`/release/list${environment ? `?environment=${environment}` : ''}`),

  // Get details for a specific release
  getReleaseDetails: (releaseId: string) => 
    apiCall<Release>(`/release/${releaseId}`),

  // Create a new release
  createRelease: (data: CreateReleaseRequest) => 
    apiCall<Release>('/release/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update release details
  updateRelease: (releaseId: string, data: UpdateReleaseRequest) => 
    apiCall<Release>(`/release/${releaseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Deploy a release
  deployRelease: (releaseId: string) => 
    apiCall<Release>(`/release/${releaseId}/deploy`, {
      method: 'POST',
    }),

  // Rollback a release
  rollbackRelease: (releaseId: string) => 
    apiCall<Release>(`/release/${releaseId}/rollback`, {
      method: 'POST',
    }),

  // Add event to a release
  addReleaseEvent: (
    releaseId: string, 
    event: { 
      type: ReleaseEvent['type']; 
      status: ReleaseEvent['status']; 
      description: string 
    }
  ) => 
    apiCall<ReleaseEvent>(`/release/${releaseId}/event`, {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  // Chat with assistant about release deployment
  chatWithAssistant: (message: string, context?: { releaseId?: string }) => 
    apiCall<ChatResponse>('/release/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

// Getting the mock user for demo purposes
export const getUserInfo = (): User => {
  return {
    id: '1',
    name: 'nghodki',
    email: 'nghodki@cisco.com',
  };
};
