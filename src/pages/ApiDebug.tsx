
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const ApiDebug = () => {
  const [apiUrl, setApiUrl] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    setApiUrl(url);
  }, []);

  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Try to fetch a simple endpoint to test connectivity
      const startTime = Date.now();
      const response = await fetch(`${apiUrl}/auth/github`, { 
        method: 'HEAD',
        redirect: 'manual' // Don't follow redirects
      });
      const endTime = Date.now();
      
      if (response.type === 'opaqueredirect') {
        setTestResult(`✅ API server is responding with a redirect as expected (${endTime - startTime}ms)\nAPI appears to be working correctly.`);
        toast({
          title: "API Connection Success",
          description: "GitHub auth endpoint is reachable and responding with a redirect as expected.",
        });
      } else if (response.ok) {
        setTestResult(`✅ API server is responding (${endTime - startTime}ms)\nStatus: ${response.status}`);
        toast({
          title: "API Connection Success",
          description: "GitHub auth endpoint is reachable.",
        });
      } else {
        setTestResult(`⚠️ API server responded with status: ${response.status} (${endTime - startTime}ms)\nThis may still be okay for auth endpoints.`);
        toast({
          title: "API Response Warning",
          description: `Server responded with status: ${response.status}`,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("API connection test failed:", error);
      setTestResult(`❌ API connection failed: ${error instanceof Error ? error.message : String(error)}\n\nCheck that your API server is running at ${apiUrl}`);
      toast({
        title: "API Connection Failed",
        description: "Could not connect to the API server. Check that it's running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-gray-100 p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">API Connection Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">API URL Configuration</h3>
            <div className="p-3 bg-muted rounded-md">
              <p className="font-mono text-sm break-all">{apiUrl}</p>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <Button 
              onClick={testApiConnection} 
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />}
              <span>Test API Connection</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.location.href = "/"}
            >
              Back to Home
            </Button>
          </div>
          
          {testResult && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Test Result</h3>
              <div className="bg-muted p-4 rounded-md">
                <pre className="whitespace-pre-wrap font-mono text-sm">{testResult}</pre>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-4 rounded-md mt-6">
            <h3 className="font-medium text-blue-800 mb-2">Debugging Tips</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
              <li>Make sure your API server is running on the correct port (default: 8000)</li>
              <li>Check that CORS is properly configured on your API server</li>
              <li>Verify that environment variables are set correctly</li>
              <li>Check your browser console for any JavaScript errors</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiDebug;
