
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { oidcApi } from '@/services/api';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("AuthCallback component mounted - processing authentication data");
        console.log("Current location:", location.pathname, location.search);
        
        // Get the parameters from URL
        const urlParams = new URLSearchParams(location.search);
        const accessToken = urlParams.get('accessToken');
        const refreshToken = urlParams.get('refreshToken');
        const expiresAt = urlParams.get('expiresAt');
        const error = urlParams.get('error');
        
        // Handle any errors
        if (error) {
          console.error('Authentication error:', error);
          setError('Authentication failed');
          toast({
            title: "Authentication failed",
            description: "There was an error during authentication.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }
        
        // If we have tokens, store them and redirect
        if (accessToken && refreshToken && expiresAt) {
          console.log("Received authentication tokens");
          
          // Store tokens
          const tokens = {
            accessToken,
            refreshToken,
            expiresAt: parseInt(expiresAt)
          };
          
          localStorage.setItem('auth_tokens', JSON.stringify(tokens));
          
          // Make a request to get the user data using the token
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
          const response = await fetch(`${API_BASE_URL}/auth/session`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.user) {
              // Store the user data
              localStorage.setItem('user', JSON.stringify(userData.user));
              
              // Log the user in using the context
              if (login) {
                await login(userData.user.email, 'password-not-used');
                
                toast({
                  title: "GitHub Login Successful",
                  description: `Welcome, ${userData.user.name || userData.user.email}!`,
                });
                
                navigate('/dashboard', { replace: true });
              } else {
                console.error("Login function not available in context");
                window.location.href = '/dashboard';
              }
              return;
            }
          }
          
          // If we couldn't get user data, still try to proceed
          navigate('/dashboard', { replace: true });
          return;
        }
        
        // If no tokens and no error, something unexpected happened
        console.error('Missing tokens in URL');
        setError('Authentication data missing');
        toast({
          title: "Authentication failed",
          description: "Could not complete authentication.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } catch (err: any) {
        console.error('Error processing authentication callback:', err);
        setError(err?.message || 'An unexpected error occurred');
        toast({
          title: "Authentication failed",
          description: err?.message || "An unexpected error occurred during authentication.",
          variant: "destructive",
        });
        // Navigate to home after error
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } finally {
        setIsProcessing(false);
      }
    };
    
    // Execute the callback handler
    handleCallback();
  }, [navigate, login, location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-professional-gray-light/50">
      {error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4">Redirecting to front page...</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication in progress</h1>
          <div className="mt-4 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Please wait while we complete your authentication...</p>
          <p className="text-sm text-gray-500 mt-2">You will be redirected automatically.</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
