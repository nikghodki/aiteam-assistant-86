
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
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  saveOIDCConfig: (provider: string, config: OIDCConfig) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(mockUser);
  const [isLoading, setIsLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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

  const loginWithGoogle = async () => {
    setIsLoading(true);
    
    try {
      // For demonstration purposes, we'll simulate a Google login
      // In a real app, you would use Firebase, Google Auth API, or your backend for this
      
      // 1. In a real implementation, open a popup window for Google authentication
      // 2. Redirect to Google's sign-in page
      // 3. Process the callback with user information
      
      // For this demo, we'll simulate a successful Google login
      window.open(`${API_BASE_URL}/auth/google`, '_self');
      
      // The actual handling of the Google auth callback would be done in a separate component
      // This is just a placeholder function that initiates the flow
      
    } catch (error) {
      console.error('Google login failed:', error);
      throw new Error('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
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

  // Add the saveOIDCConfig method to save OIDC configuration to localStorage
  const saveOIDCConfig = (provider: string, config: OIDCConfig) => {
    const oidcConfigKey = `oidc_config_${provider}`;
    localStorage.setItem(oidcConfigKey, JSON.stringify(config));
    console.log(`OIDC configuration for ${provider} saved to localStorage`);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      loginWithGoogle,
      logout,
      saveOIDCConfig
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
