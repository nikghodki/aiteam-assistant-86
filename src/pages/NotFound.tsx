
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "with query params:",
      location.search
    );
    
    // Check if this is a misrouted auth callback
    if (location.search.includes('user_data')) {
      console.log("Detected misrouted auth callback in NotFound, attempting to handle it directly");
      setIsProcessingAuth(true);
      
      // Instead of redirecting, try to process the auth data directly
      handleAuthCallback();
    }
  }, [location]);

  // Process auth callback data directly if possible
  const handleAuthCallback = async () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const userData = urlParams.get('user_data');
      
      if (userData) {
        console.log("Processing user_data directly in NotFound component");
        
        // Decode the user data
        const decodedUserData = JSON.parse(atob(userData));
        console.log("Successfully decoded user data:", decodedUserData.email || "no email");
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(decodedUserData));
        
        // Update auth context to reflect logged-in state
        if (login) {
          await login(decodedUserData.email, 'password-not-used');
          console.log("User authenticated successfully via NotFound component");
          
          // Show success toast
          toast({
            title: "Login successful",
            description: `Welcome, ${decodedUserData.name || decodedUserData.email}!`,
          });
          
          // Redirect to front page with a slight delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
          return;
        }
      }
    } catch (error) {
      console.error("Failed to process auth callback data:", error);
      setIsProcessingAuth(false);
      
      // If processing fails, try a different approach
      toast({
        title: "Authentication error",
        description: "There was an issue processing your login. Trying alternative method...",
        variant: "destructive",
      });
      
      // Try redirecting to the auth callback route directly
      setTimeout(() => {
        // Navigate to the AuthCallback component directly
        navigate('/auth/callback' + location.search, { replace: true });
      }, 1000);
    }
  };

  // Manual redirect handler
  const handleManualRedirect = () => {
    if (location.search.includes('user_data')) {
      console.log("Manual redirect to auth callback initiated");
      // Try redirecting to the auth callback route
      navigate('/auth/callback' + location.search, { replace: true });
    } else {
      navigate('/');
    }
  };

  if (isProcessingAuth) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-blue-500">Processing Authentication</h1>
          <div className="mt-4 w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-md text-gray-600 mt-4">Please wait while we complete your login...</p>
          <p className="text-sm text-gray-500 mt-2">You will be redirected to the front page automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-red-500">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          The page you're looking for doesn't exist or you may have been redirected incorrectly.
          <br />
          Current path: <code className="bg-gray-200 px-1 rounded">{location.pathname}</code>
        </p>
        
        {location.search.includes('user_data') ? (
          <div className="space-y-4">
            <p className="text-amber-600">This appears to be a misrouted authentication callback.</p>
            <Button 
              onClick={handleManualRedirect}
              variant="default"
              className="mr-2"
            >
              Complete Authentication
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
          >
            Return to Home
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFound;
