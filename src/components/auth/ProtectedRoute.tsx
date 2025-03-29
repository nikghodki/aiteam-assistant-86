
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { bypassAuthForTesting, user, tokens, refreshAccessToken } = useAuth();
  const location = useLocation();
  
  // For testing purposes, allow access to all routes
  if (bypassAuthForTesting) {
    return <>{children}</>;
  }
  
  // Check for user in localStorage as a backup
  const storedUser = localStorage.getItem('user');
  const hasStoredUser = !!storedUser;

  // Check for tokens in localStorage as a backup
  const storedTokens = localStorage.getItem('auth_tokens');
  const hasStoredTokens = !!storedTokens;
  
  // Effect to attempt token refresh if we have tokens but user is not authenticated
  useEffect(() => {
    const attemptRefresh = async () => {
      if (!user?.authenticated && hasStoredTokens) {
        try {
          // Parse stored tokens
          const parsedTokens = JSON.parse(storedTokens);
          if (parsedTokens.refreshToken) {
            // Try to refresh the access token
            await refreshAccessToken(parsedTokens.refreshToken);
          }
        } catch (error) {
          console.error("Failed to refresh token:", error);
        }
      }
    };
    
    attemptRefresh();
  }, [user?.authenticated, hasStoredTokens, refreshAccessToken]);
  
  // Effect to show toast when redirecting due to authentication
  useEffect(() => {
    if (!user?.authenticated && !hasStoredUser && !hasStoredTokens) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "default",
      });
    }
  }, [user?.authenticated, hasStoredUser, hasStoredTokens]);
  
  // In a real implementation, check both user and token validity
  if (!user?.authenticated && !hasStoredUser && !hasStoredTokens) {
    // Redirect to login and remember where the user was trying to go
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute;
