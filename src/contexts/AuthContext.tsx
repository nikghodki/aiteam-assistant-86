
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OIDCConfig } from '@/services/api';
import { toast } from '@/components/ui/use-toast';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
  
  // Initialize state with stored user or test user based on environment
  const [user, setUser] = useState<User>(() => {
    const storedUser = getStoredUser();
    if (storedUser) return storedUser;
    return import.meta.env.DEV ? testUser : { id: '', name: '', email: '', authenticated: false };
  });
  
  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    return import.meta.env.DEV ? testTokens : null;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [bypassAuthForTesting, setBypassAuthForTesting] = useState(() => {
    return import.meta.env.DEV ? true : false;
  });
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
      // Store the provider in session storage for the callback
      sessionStorage.setItem('oidc_provider', 'github');
      
      // In development mode, simulate GitHub login
      if (import.meta.env.DEV) {
        const mockGithubUser = {
          id: 'github-user-id',
          name: 'GitHub User',
          email: 'github-user@example.com',
          photoUrl: 'https://avatars.githubusercontent.com/u/1234567',
          authenticated: true
        };
        
        localStorage.setItem('user', JSON.stringify(mockGithubUser));
        setUser(mockGithubUser);
        setTokens(testTokens);
        
        // Redirect to auth callback to simulate the flow
        window.location.href = '/auth/callback?code=mock-code&state=mock-state';
        return;
      }
      
      // Redirect to GitHub login
      const redirectUrl = `${window.location.origin}/auth/callback`;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUrl)}&scope=user:email&state=github`;
      
      window.location.href = githubAuthUrl;
    } catch (error) {
      console.error('GitHub login failed:', error);
      setIsLoading(false);
      toast({
        title: "GitHub Login Failed",
        description: "Could not redirect to GitHub authentication",
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
    if (!tokens || !tokens.accessToken) {
      return {};
    }
    return { Authorization: `Bearer ${tokens.accessToken}` };
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
      getAuthHeader
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
