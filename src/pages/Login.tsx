
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { Terminal, Lock } from 'lucide-react';

const Login = () => {
  const { user, loading, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  useEffect(() => {
    // If user is already logged in, redirect
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  // Load Google Sign-In SDK
  useEffect(() => {
    const loadGoogleScript = () => {
      // Check if script already exists
      if (document.querySelector('script#google-signin-script')) return;
      
      const script = document.createElement('script');
      script.id = 'google-signin-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
      
      window.onGoogleLibraryLoad = initializeGoogleSignIn;
    };
    
    loadGoogleScript();
    
    return () => {
      // Cleanup
      const script = document.getElementById('google-signin-script');
      if (script) script.remove();
    };
  }, []);
  
  const initializeGoogleSignIn = () => {
    if (window.google && !document.getElementById('g_id_onload')) {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '123456789-example.apps.googleusercontent.com',
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton')!,
        { 
          type: 'standard', 
          theme: 'outline', 
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
          width: 280
        }
      );
    }
  };
  
  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) {
      toast({
        title: "Login Failed",
        description: "Could not authenticate with Google",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoggingIn(true);
      await googleLogin(response.credential);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-6">
      <GlassMorphicCard className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Terminal size={36} className="text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">AI Team Assistant</h1>
          <p className="text-muted-foreground mt-2">Sign in to access your dashboard</p>
        </div>
        
        <div className="flex flex-col items-center space-y-6">
          <div className="w-full p-6 bg-card rounded-md border border-border">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Lock size={18} />
              <h2 className="font-medium">Secure Sign In</h2>
            </div>
            
            <p className="text-sm text-center text-muted-foreground mb-6">
              Please sign in with your Google account to continue
            </p>
            
            <div className="flex justify-center">
              {isLoggingIn ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm">Signing in...</span>
                </div>
              ) : (
                <div id="googleSignInButton" className="w-full flex justify-center"></div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </GlassMorphicCard>
    </div>
  );
};

export default Login;
