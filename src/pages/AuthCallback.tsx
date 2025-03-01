
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login, getOIDCConfig } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        // Get the provider from session storage
        const provider = sessionStorage.getItem('oidc_provider');
        
        // Clear session storage
        sessionStorage.removeItem('oidc_provider');
        
        if (error || !code || !state || !provider) {
          console.error('Authentication error:', error, errorDescription);
          setError(errorDescription || 'Authentication failed');
          toast({
            title: "Authentication failed",
            description: errorDescription || "There was an error during authentication.",
            variant: "destructive",
          });
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Get the provider config
        const config = getOIDCConfig(provider);
        
        if (!config) {
          throw new Error(`Provider ${provider} configuration not found`);
        }
        
        // In a real implementation, you would:
        // 1. Send the code to your backend
        // 2. Backend would exchange it for tokens
        // 3. Validate tokens and create a session
        
        // For this demo, we'll simulate a successful authentication
        await login(`user@${provider}.com`, 'password-not-used');
        
        toast({
          title: "Authentication successful",
          description: `Successfully authenticated with ${provider}`,
        });
        
        // Redirect to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Error processing authentication callback:', err);
        setError('An unexpected error occurred');
        toast({
          title: "Authentication failed",
          description: "An unexpected error occurred during authentication.",
          variant: "destructive",
        });
        setTimeout(() => navigate('/login'), 3000);
      }
    };
    
    handleCallback();
  }, [navigate, login, getOIDCConfig]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-professional-gray-light/50">
      {error ? (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Failed</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <p className="mt-4">Redirecting to login page...</p>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication in progress</h1>
          <div className="mt-4 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">Please wait while we complete your authentication...</p>
        </div>
      )}
    </div>
  );
};

export default AuthCallback;
