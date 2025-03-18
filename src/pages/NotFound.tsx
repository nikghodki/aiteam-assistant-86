
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
      "with query params:",
      location.search
    );
    
    // Check if this is a misrouted auth callback
    if (location.pathname.includes('/auth/callback') && location.search.includes('user_data')) {
      console.log("Detected misrouted auth callback, attempting to fix routing");
      
      // For auth callback misrouting, try a window.location approach for a full page reload
      setTimeout(() => {
        console.log("Redirecting to correct auth callback URL");
        window.location.href = `/auth/callback${location.search}`;
      }, 100);
    }
  }, [location]);

  // Handle potential auth callback redirect
  const handleRedirectToAuthCallback = () => {
    if (location.pathname.includes('/auth/callback') && location.search.includes('user_data')) {
      console.log("Manual redirect to auth callback initiated");
      // Use window.location for a full page redirect rather than React Router navigate
      window.location.href = `/auth/callback${location.search}`;
    } else {
      navigate('/');
    }
  };

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
        
        {location.pathname.includes('/auth/callback') && location.search.includes('user_data') ? (
          <div className="space-y-4">
            <p className="text-amber-600">This appears to be a misrouted authentication callback.</p>
            <Button 
              onClick={handleRedirectToAuthCallback}
              variant="default"
              className="mr-2"
            >
              Fix Redirect
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
