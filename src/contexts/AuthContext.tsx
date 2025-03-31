import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OIDCConfig } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

// Simplified user model with authentication support
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  authenticated: boolean;
}

// Add JWT token interface
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

// Test user that is always authenticated
const testUser: User = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  authenticated: true
};

// Test JWT token for testing purposes
const testTokens: AuthTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoiVGVzdCBVc2VyIiwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  refreshToken: 'refresh-token-for-testing',
  expiresAt: Date.now() + 3600000 // 1 hour from now
};

interface AuthContextType {
  user: User;
  tokens: AuthTokens | null;
  isLoading: boolean;
  bypassAuthForTesting: boolean;
  toggleBypassAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => void;
  saveOIDCConfig: (provider: string, config: OIDCConfig) => void;
  getAuthHeader: () => { Authorization: string } | {};
  refreshAccessToken: (refreshToken: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  // Get stored user from localStorage if available
  const getStoredUser = (): User | null => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        return {
          ...parsedUser,
          authenticated: true
        };
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    return null;
  };
  
  // Get stored tokens from localStorage if available
  const getStoredTokens = (): AuthTokens | null => {
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        return JSON.parse(storedTokens);
      } catch (e) {
        console.error('Failed to parse stored tokens', e);
      }
    }
    return null;
  };
  
  // Initialize state with stored user or test user based on environment
  const [user, setUser] = useState<User>(() => {
    const storedUser = getStoredUser();
    if (storedUser) return storedUser;
    return import.meta.env.DEV ? testUser : { id: '', name: '', email: '', authenticated: false };
  });
  
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    const storedTokens = getStoredTokens();
    if (storedTokens) return storedTokens;
    return import.meta.env.DEV ? testTokens : null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [bypassAuthForTesting, setBypassAuthForTesting] = useState(() => {
    return import.meta.env.DEV ? true : false;
  });
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // Add refreshAccessToken function
  const refreshAccessToken = async (refreshToken: string): Promise<boolean> => {
    try {
      console.log('Attempting to refresh access token');
      
      // For testing purposes in development mode
      if (import.meta.env.DEV) {
        // Update the test tokens with a new expiry
        const updatedTestTokens = {
          ...testTokens,
          expiresAt: Date.now() + 3600000 // extend by 1 hour
        };
        
        setTokens(updatedTestTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(updatedTestTokens));
        
        return true;
      }
      
      // In production, make an actual API call to refresh the token
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }
      
      const data = await response.json();
      
      if (data.accessToken) {
        // Update tokens with the new access token
        const updatedTokens = {
          ...tokens,
          accessToken: data.accessToken,
          expiresAt: data.expiresAt
        };
        
        setTokens(updatedTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(updatedTokens));
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      console.log(`Logging in user with email: ${email}`);
      
      // For testing purposes, just simulate a successful login
      if (import.meta.env.DEV) {
        const mockUser = {
          id: 'test-user-id',
          name: 'Test User',
          email: email,
          authenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        
        // Set mock tokens
        setTokens(testTokens);
        localStorage.setItem('auth_tokens', JSON.stringify(testTokens));
      }
      
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // GitHub login function
  const loginWithGithub = async () => {
    setIsLoading(true);
    
    try {
      console.log("Initiating GitHub login");
      
      // In development mode with bypass enabled, simulate GitHub login
      if (import.meta.env.DEV && bypassAuthForTesting) {
        const mockGithubUser = {
          id: 'github-user-id',
          name: 'GitHub User',
          email: 'github-user@example.com',
          photoUrl: 'https://avatars.githubusercontent.com/u/1234567',
          authenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(mockGithubUser));
        setUser(mockGithubUser);
        
        // Store tokens in localStorage for persistence
        localStorage.setItem('auth_tokens', JSON.stringify(testTokens));
        setTokens(testTokens);
        
        toast({
          title: "GitHub Login Successful (Dev Mode)",
          description: "Welcome, GitHub User!",
        });
        
        // Redirect to dashboard in dev mode
        navigate('/dashboard');
        return;
      }
      
      // Redirect to our backend API endpoint for GitHub login
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      console.log("Redirecting to GitHub auth endpoint:", `${API_BASE_URL}/auth/github`);
      window.location.href = `${API_BASE_URL}/auth/github`;
    } catch (error) {
      console.error('GitHub login failed:', error);
      setIsLoading(false);
      toast({
        title: "GitHub Login Failed",
        description: "Could not initiate GitHub authentication",
        variant: "destructive",
      });
    }
  };

  // Google login function
  const loginWithGoogle = async () => {
    // Implement later if needed
    console.log("Google login not yet implemented");
    return Promise.resolve();
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth_tokens');
    setUser({
      id: '',
      name: '',
      email: '',
      authenticated: false
    });
    setTokens(null);
  };

  const toggleBypassAuth = () => {
    // Only allow toggling in dev mode
    if (import.meta.env.DEV) {
      setBypassAuthForTesting(prev => !prev);
    }
  };

  const saveOIDCConfig = (provider: string, config: OIDCConfig) => {
    console.log(`OIDC configuration for ${provider} saved`);
    // Implement if needed
  };

  // Function to get authorization header for API requests
  const getAuthHeader = () => {
    // First check context tokens
    if (tokens && tokens.accessToken) {
      return { Authorization: `Bearer ${tokens.accessToken}` };
    }
    
    // Then check localStorage as fallback
    try {
      const storedTokens = localStorage.getItem('auth_tokens');
      if (storedTokens) {
        const parsedTokens = JSON.parse(storedTokens);
        if (parsedTokens && parsedTokens.accessToken) {
          return { Authorization: `Bearer ${parsedTokens.accessToken}` };
        }
      }
    } catch (e) {
      console.error('Failed to retrieve tokens from localStorage', e);
    }
    
    return {};
  };

  // Effect to check authentication state on startup
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          ...parsedUser,
          authenticated: true
        });
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }
    
    const storedTokens = localStorage.getItem('auth_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
      } catch (e) {
        console.error('Failed to parse stored tokens', e);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      tokens,
      isLoading, 
      bypassAuthForTesting,
      toggleBypassAuth,
      login, 
      loginWithGoogle,
      loginWithGithub,
      logout,
      saveOIDCConfig,
      getAuthHeader,
      refreshAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
