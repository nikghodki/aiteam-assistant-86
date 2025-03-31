
import { Button } from "@/components/ui/button";

const Fallback = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">SRE Assistant</h1>
        <p className="mb-6 text-gray-600">
          Welcome to SRE Assistant. This is a simplified landing page.
        </p>
        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = '/login'}
            className="w-full"
          >
            Go to Login
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="outline"
            className="w-full"
          >
            Try Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Fallback;
