
// API client for backend communication

// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface CommandResponse {
  output: string;
  error?: string;
  exitCode: number;
}

export interface ChatResponse {
  response: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export interface JiraTicket {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
  created: string;
  updated: string;
  url: string;
}

export interface UserAccess {
  id: number;
  name: string;
  role: string;
  services: string[];
}

export interface AccessRequest {
  userId: number;
  service: string;
  reason: string;
  jiraTicketKey?: string;
}

export interface DocumentSearchResult {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  category: string;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: ApiError = {
      message: errorData.detail || 'An error occurred',
      status: response.status
    };
    throw error;
  }
  return response.json() as Promise<T>;
};

export const kubernetesApi = {
  async runCommand(cluster: string, command: string, jiraTicketKey?: string): Promise<CommandResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kubernetes/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cluster, command, jiraTicketKey }),
      });
      return handleResponse<CommandResponse>(response);
    } catch (error) {
      console.error('Error running command:', error);
      throw error;
    }
  },

  async chatWithAssistant(cluster: string, message: string, jiraTicketKey?: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kubernetes/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cluster, message, jiraTicketKey }),
      });
      return handleResponse<ChatResponse>(response);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      throw error;
    }
  },

  async createSession(cluster: string, description: string): Promise<JiraTicket> {
    try {
      const response = await fetch(`${API_BASE_URL}/kubernetes/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cluster, description }),
      });
      return handleResponse<JiraTicket>(response);
    } catch (error) {
      console.error('Error creating debug session:', error);
      throw error;
    }
  },
};

export const accessApi = {
  async getUsers(): Promise<UserAccess[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/users`);
      return handleResponse<UserAccess[]>(response);
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUserAccess(userId: number): Promise<string[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/user/${userId}`);
      return handleResponse<string[]>(response);
    } catch (error) {
      console.error('Error fetching user access:', error);
      throw error;
    }
  },

  async requestAccess(request: AccessRequest): Promise<JiraTicket> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      return handleResponse<JiraTicket>(response);
    } catch (error) {
      console.error('Error requesting access:', error);
      throw error;
    }
  },

  async updateAccess(userId: number, services: string[]): Promise<UserAccess> {
    try {
      const response = await fetch(`${API_BASE_URL}/access/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, services }),
      });
      return handleResponse<UserAccess>(response);
    } catch (error) {
      console.error('Error updating access:', error);
      throw error;
    }
  },
};

export const docsApi = {
  async searchDocumentation(query: string): Promise<DocumentSearchResult[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/docs/search?q=${encodeURIComponent(query)}`);
      return handleResponse<DocumentSearchResult[]>(response);
    } catch (error) {
      console.error('Error searching documentation:', error);
      throw error;
    }
  },

  async getDocumentById(id: number): Promise<DocumentSearchResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/docs/${id}`);
      return handleResponse<DocumentSearchResult>(response);
    } catch (error) {
      console.error('Error fetching document:', error);
      throw error;
    }
  },
};

export const jiraApi = {
  async createTicket(project: string, summary: string, description: string, issueType: string = 'Task'): Promise<JiraTicket> {
    try {
      const response = await fetch(`${API_BASE_URL}/jira/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project,
          summary,
          description,
          issueType,
        }),
      });
      return handleResponse<JiraTicket>(response);
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      throw error;
    }
  },

  async getTicket(ticketKey: string): Promise<JiraTicket> {
    try {
      const response = await fetch(`${API_BASE_URL}/jira/ticket/${ticketKey}`);
      return handleResponse<JiraTicket>(response);
    } catch (error) {
      console.error('Error fetching Jira ticket:', error);
      throw error;
    }
  },

  async updateTicket(ticketKey: string, fields: Record<string, any>): Promise<JiraTicket> {
    try {
      const response = await fetch(`${API_BASE_URL}/jira/ticket/${ticketKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fields),
      });
      return handleResponse<JiraTicket>(response);
    } catch (error) {
      console.error('Error updating Jira ticket:', error);
      throw error;
    }
  },
};
