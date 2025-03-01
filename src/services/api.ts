
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
  async runCommand(cluster: string, command: string): Promise<CommandResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kubernetes/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cluster, command }),
      });
      return handleResponse<CommandResponse>(response);
    } catch (error) {
      console.error('Error running command:', error);
      throw error;
    }
  },

  async chatWithAssistant(cluster: string, message: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/kubernetes/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cluster, message }),
      });
      return handleResponse<ChatResponse>(response);
    } catch (error) {
      console.error('Error chatting with assistant:', error);
      throw error;
    }
  },
};
