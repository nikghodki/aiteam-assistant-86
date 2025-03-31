// API base URL should be configured in your environment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
export const S3_BUCKET_URL = import.meta.env.VITE_S3_BUCKET_URL || 'https://k8s-debugger-bucket.s3.amazonaws.com';

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
  s3_file_path?: string;
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

export interface NamespaceIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  kind: string;
  name: string;
  message: string;
  timestamp: string;
}

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

export const fetchS3File = async (filePath: string): Promise<string> => {
  if (!filePath) {
    throw new Error('File path is required');
  }
  
  try {
    // Make sure to remove any leading slash
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    const url = `${S3_BUCKET_URL}/${cleanPath}`;
    
    console.log(`Fetching S3 file from URL: ${url}`);
    
    const response = await fetch(url, {
      cache: 'no-store', // Disable caching to ensure we get fresh content
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`S3 fetch error: Status ${response.status}, Response:`, errorText);
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }
    
    const content = await response.text();
    console.log(`S3 file fetched successfully. Content length: ${content.length}`);
    if (!content || content.trim() === '') {
      console.warn('Warning: S3 file content is empty');
    }
    
    return content;
  } catch (error) {
    console.error("Error fetching S3 file:", error);
    throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const accessApi = {
  getUserGroups: (userEmail: string) => 
    apiCall<any[]>('/access/groups', {
      method: 'POST',
      body: JSON.stringify({ userEmail }),
    }),

  requestGroupAccess: (groupId: number, reason: string, userEmail: string) => 
    apiCall<JiraTicket>('/access/groups/request', {
      method: 'POST',
      body: JSON.stringify({ groupId, reason, userEmail }),
    }),

  leaveGroup: (groupName: string, userEmail: string) =>
    apiCall<{ success: boolean }>('/access/groups/leave', {
      method: 'POST',
      body: JSON.stringify({ groupName, userEmail }),
    }),

  chatWithAssistant: (message: string, userEmail: string) => 
    apiCall<ChatResponse>('/access/chat', {
      method: 'POST',
      body: JSON.stringify({ message, userEmail }),
    }),
};

export const docsApi = {
  searchDocumentation: (query: string) => 
    apiCall<DocumentResult[]>('/docs/search', {
      method: 'POST',
      body: JSON.stringify({ query }),
    }),

  getDocumentById: (id: number) => 
    apiCall<DocumentResult>(`/docs/${id}`),

  submitFeedback: (documentId: number, helpful: boolean) => 
    apiCall<{success: boolean}>('/docs/feedback', {
      method: 'POST',
      body: JSON.stringify({ documentId, helpful }),
    }),

  chatWithAssistant: (message: string, context?: string[], history?: ChatMessage[]) => 
    apiCall<ChatResponse>('/docs/chat', {
      method: 'POST',
      body: JSON.stringify({ 
        message, 
        context, 
        history 
      }),
    }),

  getChatHistory: () => 
    apiCall<ChatMessage[]>('/docs/chat/history'),

  getQueryHistory: () => 
    apiCall<QueryHistoryItem[]>('/docs/history'),

  clearChatHistory: () => 
    apiCall<{success: boolean}>('/docs/chat/clear', {
      method: 'POST'
    }),
};

export const kubernetesApi = {
  getClusters: (environment?: 'production' | 'qa' | 'staging') => 
    apiCall<KubernetesCluster[]>(`/kubernetes/clusters${environment ? `?environment=${environment}` : ''}`),

  createSession: (cluster: string, description: string) => 
    apiCall<JiraTicket>('/kubernetes/session', {
      method: 'POST',
      body: JSON.stringify({ cluster, description }),
    }),

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

  chatWithAssistant: (clusterArn: string, message: string, namespace: string) => 
    apiCall<ChatResponse>('/kubernetes/chat', {
      method: 'POST',
      body: JSON.stringify({ clusterArn, message, namespace }),
    }),

  getDebugSessions: () => 
    apiCall<any[]>('/kubernetes/sessions'),

  getSessionDetails: (sessionId: string) => 
    apiCall<any>(`/kubernetes/sessions/${sessionId}`),

  getClusterHealth: (cluster: string) => 
    apiCall<any>(`/kubernetes/health/${cluster}`),
    
  downloadDebugFile: (sessionId: string) =>
    apiCall<{url: string}>(`/kubernetes/debug-file/${sessionId}`),

  getNamespaces: (clusterArn: string): Promise<string[]> => {
    if (!clusterArn) {
      return Promise.reject(new Error('Cluster ARN is required'));
    }
    
    return apiCall<string[]>(`/kubernetes/namespaces`, {
      method: 'POST',
      body: JSON.stringify({ clusterArn }),
    });
  },

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

export const jiraApi = {
  createTicket: (ticketData: JiraTicketCreateRequest) => 
    apiCall<JiraTicket>('/jira/ticket', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    }),

  getUserTickets: (filters?: { reporter?: string, status?: string }) => 
    apiCall<JiraTicket[]>(`/jira/tickets${filters ? `?${new URLSearchParams(filters as Record<string, string>).toString()}` : ''}`),
  
  getUserReportedTickets: () => 
    apiCall<JiraTicket[]>('/jira/tickets/reported-by-me'),

  getTicketDetails: (ticketKey: string) => 
    apiCall<JiraTicket>(`/jira/tickets/${ticketKey}`),

  getProjects: () => 
    apiCall<JiraProject[]>('/jira/projects'),

  getIssueTypes: (projectId?: string) => 
    apiCall<JiraIssueType[]>(`/jira/issue-types${projectId ? `?projectId=${projectId}` : ''}`),

  chatWithAssistant: (message: string, context?: { ticketKey?: string }) => 
    apiCall<ChatResponse>('/jira/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    }),
};

export const rbacApi = {
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

export const oidcApi = {
  saveConfig: (provider: string, config: OIDCConfig) => 
    apiCall<{ success: boolean }>('/oidc/config', {
      method: 'POST',
      body: JSON.stringify({ provider, config }),
    }),

  getConfig: (provider: string) => 
    apiCall<OIDCConfig>(`/oidc/config/${provider}`),

  processCallback: (provider: string, code: string, state: string) => 
    apiCall<OIDCAuthResult>('/oidc/callback', {
      method: 'POST',
      body: JSON.stringify({ provider, code, state }),
    }),

  listProviders: () => 
    apiCall<string[]>('/oidc/providers'),
};

export const getUserInfo = (): User => {
  return {
    id: '1',
    name: 'nghodki',
    email: 'nghodki@cisco.com',
  };
};
