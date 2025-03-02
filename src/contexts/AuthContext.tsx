
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { oidcApi } from '@/services/api';

// Simplified user model with authentication support
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  authenticated: boolean;
}

export interface OIDCConfig {
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

// Mock user for demonstration
const mockUser: User = {
  id: '1',
  name: 'nghodki',
  email: 'nghodki@cisco.com',
  authenticated: false,
};

interface AuthContextType {
  user: User;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loginWithOIDC: (provider: string) => void;
  saveOIDCConfig: (provider: string, config: OIDCConfig) => void;
  getOIDCConfig: (provider: string) => OIDCConfig | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated (e.g., from localStorage)
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser({ ...parsedUser, authenticated: true });
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          // Clear invalid storage
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Simplified login (replace with real authentication)
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll just authenticate the mock user
      const authenticatedUser = { ...mockUser, email, authenticated: true };
      setUser(authenticatedUser);
      localStorage.setItem('user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveOIDCConfig = async (provider: string, config: OIDCConfig) => {
    // Save to localStorage for backward compatibility
    localStorage.setItem(`oidc_config_${provider}`, JSON.stringify(config));
    
    // Also save to our API
    try {
      await oidcApi.saveConfig(provider, config);
    } catch (error) {
      console.error('Error saving OIDC config to API:', error);
      // Continue with local storage anyway
    }
  };

  const getOIDCConfig = (provider: string): OIDCConfig | null => {
    // Try to get from API first (not implemented here since it would be async)
    // For simplicity, we'll stick with localStorage for now
    const config = localStorage.getItem(`oidc_config_${provider}`);
    return config ? JSON.parse(config) : null;
  };

  const loginWithOIDC = (provider: string) => {
    setIsLoading(true);
    
    // Get the stored configuration for this provider
    const config = getOIDCConfig(provider);
    
    if (!config || !config.clientId) {
      console.error(`Provider ${provider} not configured properly`);
      setIsLoading(false);
      return;
    }
    
    // Store the provider for use in the callback
    sessionStorage.setItem('oidc_provider', provider);
    
    // Construct and redirect to authorization URL
    const authUrl = new URL(config.authorizationEndpoint);
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('response_type', config.responseType);
    authUrl.searchParams.append('scope', config.scope);
    authUrl.searchParams.append('state', crypto.randomUUID());
    
    window.location.href = authUrl.toString();
    // The browser will now redirect to the IdP
    // After authentication, the IdP will redirect back to our callback URL
  };

  const logout = () => {
    setUser({ ...mockUser, authenticated: false });
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      loginWithOIDC,
      saveOIDCConfig,
      getOIDCConfig
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
