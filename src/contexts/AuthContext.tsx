
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
  loginWithSAML: () => void;
  saveOIDCConfig: (provider: string, config: OIDCConfig) => void;
  getOIDCConfig: (provider: string) => OIDCConfig | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8000/api';

  useEffect(() => {
    // Check if user is already authenticated (e.g., from localStorage or URL params)
    const checkAuth = () => {
      // Check URL parameters for SAML SSO login response
      const params = new URLSearchParams(window.location.search);
      const userData = params.get('user_data');
      
      if (userData) {
        try {
          // Decode base64 user data from SAML response
          const decodedData = atob(userData);
          const parsedUser = JSON.parse(decodedData);
          
          setUser({ ...parsedUser, authenticated: true });
          localStorage.setItem('user', JSON.stringify(parsedUser));
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Failed to parse user data from URL:', error);
        }
      }
      
      // Fall back to localStorage
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
    // Use the backend API for authentication
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      if (data.success && data.user) {
        const authenticatedUser = { ...data.user, authenticated: true };
        setUser(authenticatedUser);
        localStorage.setItem('user', JSON.stringify(authenticatedUser));
      } else {
        throw new Error('Invalid response from server');
      }
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

  const loginWithSAML = () => {
    setIsLoading(true);
    
    // Redirect to the SAML login endpoint with a redirect URL back to the dashboard
    const redirectUrl = encodeURIComponent(`${window.location.origin}/dashboard`);
    window.location.href = `${API_BASE_URL}/auth/saml/login?redirect_url=${redirectUrl}`;
    
    // The server will handle the SAML authentication flow
    // After authentication, it will redirect back to our callback URL with user data
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call the logout API
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
    }
    
    // Reset user state regardless of API success
    setUser({ ...mockUser, authenticated: false });
    localStorage.removeItem('user');
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      loginWithOIDC,
      loginWithSAML,
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
