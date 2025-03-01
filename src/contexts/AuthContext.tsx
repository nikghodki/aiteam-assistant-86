
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simplified user model with authentication support
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  authenticated: boolean;
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

  const loginWithOIDC = (provider: string) => {
    setIsLoading(true);
    
    // Construct the OIDC authorization URL
    // In a real implementation, these would come from configuration
    const oidcConfig = {
      google: {
        clientId: 'your-google-client-id',
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        redirectUri: `${window.location.origin}/auth/callback`,
        scope: 'openid profile email',
      },
      azure: {
        clientId: 'your-azure-client-id',
        authorizationEndpoint: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        redirectUri: `${window.location.origin}/auth/callback`,
        scope: 'openid profile email',
      }
    };
    
    const config = oidcConfig[provider as keyof typeof oidcConfig];
    
    if (!config) {
      console.error(`Provider ${provider} not supported`);
      setIsLoading(false);
      return;
    }
    
    // Store the provider for use in the callback
    sessionStorage.setItem('oidc_provider', provider);
    
    // Construct and redirect to authorization URL
    const authUrl = new URL(config.authorizationEndpoint);
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('redirect_uri', config.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
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
    <AuthContext.Provider value={{ user, isLoading, login, logout, loginWithOIDC }}>
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
