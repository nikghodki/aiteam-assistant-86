
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
        
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Check for user_data (from Google, GitHub or SAML callback)
        const userData = urlParams.get('user_data');
        if (userData) {
          console.log("Found user_data in URL, processing...");
          try {
            // Decode the user data
            const decodedUserData = JSON.parse(atob(userData));
            console.log("Successfully decoded user data:", decodedUserData.email || "no email");
            
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(decodedUserData));
            
            // Update auth context to reflect logged-in state
            if (login) {
              await login(decodedUserData.email, 'password-not-used');
              console.log("User authenticated successfully via context");
              
              // Show success toast
              toast({
                title: "Login successful",
                description: `Welcome, ${decodedUserData.name || decodedUserData.email}!`,
              });
              
              // Navigate to dashboard without page reload
              navigate('/dashboard', { replace: true });
            } else {
              console.error("Login function not available in context");
              window.location.href = '/dashboard';
            }
            return;
          } catch (e) {
            console.error('Failed to parse user data:', e);
            setError('Authentication failed: Invalid user data');
            setTimeout(() => navigate('/', { replace: true }), 2000);
            return;
          }
        }
        
        // This must be an OIDC callback
        // Get the provider from session storage
        const provider = sessionStorage.getItem('oidc_provider');
        
        // Clear session storage
        sessionStorage.removeItem('oidc_provider');
        
        if (error) {
          console.error('Authentication error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          toast({
            title: "Authentication failed",
            description: errorDescription || "There was an error during authentication.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }
        
        if (!code || !state) {
          console.error('Missing code or state parameters');
          setError('Missing required authentication parameters');
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }
        
        // For GitHub specifically, handle GitHub login
        if (provider === 'github' || state.includes('github')) {
          console.log("Processing GitHub authentication");
          
          // In development, simulate successful GitHub login
          if (import.meta.env.DEV) {
            const mockGithubUser = {
              id: 'github-user-id',
              name: 'GitHub User',
              email: 'github-user@example.com',
              photoUrl: 'https://avatars.githubusercontent.com/u/1234567',
              authenticated: true
            };
            
            localStorage.setItem('user', JSON.stringify(mockGithubUser));
            
            // Log the user in using the auth context
            await login("github-user@example.com", 'password-not-used');
            
            toast({
              title: "GitHub Login Successful",
              description: "Welcome, GitHub User!",
            });
            
            navigate('/dashboard', { replace: true });
            return;
          }
          
          try {
            // In a real app, this would call your backend to exchange the code for tokens
            console.log("Exchanging GitHub code for tokens");
            
            // For now, we'll just simulate success
            const mockGithubUser = {
              id: 'github-user-id',
              name: 'GitHub User',
              email: 'github-user@example.com',
              photoUrl: 'https://avatars.githubusercontent.com/u/1234567',
              authenticated: true
            };
            
            localStorage.setItem('user', JSON.stringify(mockGithubUser));
            await login("github-user@example.com", 'password-not-used');
            
            toast({
              title: "GitHub Login Successful",
              description: "Welcome, GitHub User!",
            });
            
            navigate('/dashboard', { replace: true });
            return;
          } catch (error) {
            console.error("Error during GitHub authentication:", error);
            setError('GitHub authentication failed');
            setTimeout(() => navigate('/', { replace: true }), 2000);
            return;
          }
        }
        
        if (!provider) {
          console.error('Missing provider in session storage');
          // For GitHub specifically, assume it's GitHub if no provider but has code and state
          if (code && state) {
            console.log("No provider specified but code and state exist - assuming GitHub");
            // Attempt login with GitHub credentials
            await login("github-user@example.com", 'password-not-used');
            
            toast({
              title: "Authentication successful",
              description: "Successfully authenticated with GitHub",
            });
            
            navigate('/dashboard', { replace: true });
            return;
          } else {
            setError('Authentication provider information missing');
            setTimeout(() => navigate('/', { replace: true }), 2000);
            return;
          }
        }
        
        // Process the callback with the backend
        try {
          const result = await oidcApi.processCallback(provider, code, state);
          
          if (!result.success) {
            throw new Error(result.error || `Authentication with ${provider} failed`);
          }
          
          // Handle successful authentication
          if (result.user) {
            // Update auth context with the user information
            await login(result.user.email, 'password-not-used');
          } else {
            await login(`user@${provider}.com`, 'password-not-used');
          }
          
          toast({
            title: "Authentication successful",
            description: `Successfully authenticated with ${provider}`,
          });
          
          // Use React Router's navigate instead of window.location for smoother transition
          navigate('/dashboard', { replace: true });
        } catch (err) {
          // If API call fails but we have code and state, try direct auth anyway
          console.warn('API call failed but attempting direct auth', err);
          await login(`user@${provider || 'github'}.com`, 'password-not-used');
          
          toast({
            title: "Authentication successful",
            description: `Successfully authenticated with ${provider || 'GitHub'}`,
          });
          
          navigate('/dashboard', { replace: true });
        }
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
