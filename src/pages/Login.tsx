
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Github } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithGithub, user } = useAuth();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (user.authenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [user.authenticated, navigate]);

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
      // Note: The actual redirect will be handled by the GitHub auth flow
    } catch (error) {
      toast({
        title: "GitHub login failed",
        description: "There was a problem signing in with GitHub. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-professional-gray-light/50">
      <Card className="w-[400px] shadow-lg bg-gradient-professional">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in to aiteam-assistant</CardTitle>
          <CardDescription>
            Sign in with your GitHub account to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub Sign-In Button */}
          <Button 
            type="button" 
            variant="default" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleGithubLogin}
          >
            <Github className="h-5 w-5" />
            <span>Sign in with GitHub</span>
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
