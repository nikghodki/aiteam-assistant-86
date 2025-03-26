
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { OIDCConfig } from '@/services/api';

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
  // Always use the test user and tokens for testing
  const [user, setUser] = useState<User>(testUser);
  const [tokens, setTokens] = useState<AuthTokens | null>(testTokens);
  const [isLoading, setIsLoading] = useState(false);
  const [bypassAuthForTesting, setBypassAuthForTesting] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  // All authentication methods are no-ops for testing
  const login = async (_email: string, _password: string) => {
    return Promise.resolve();
  };

  const loginWithGoogle = async () => {
    return Promise.resolve();
  };

  const loginWithGithub = async () => {
    return Promise.resolve();
  };

  const logout = async () => {
    return Promise.resolve();
  };

  const toggleBypassAuth = () => {
    // Always keep bypass enabled for testing
    setBypassAuthForTesting(true);
  };

  const saveOIDCConfig = (provider: string, config: OIDCConfig) => {
    console.log(`OIDC configuration for ${provider} saved (test mode)`);
  };

  // Function to get authorization header for API requests
  const getAuthHeader = () => {
    if (!tokens || !tokens.accessToken) {
      return {};
    }
    return { Authorization: `Bearer ${tokens.accessToken}` };
  };

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
