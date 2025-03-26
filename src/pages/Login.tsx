import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Github, LogIn, Mail, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithGithub, isLoading, user, bypassAuthForTesting, toggleBypassAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (bypassAuthForTesting || user.authenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [bypassAuthForTesting, user.authenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
      toast({
        title: "Login successful",
        description: `Welcome back, ${email}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      toast({
        title: "Google login failed",
        description: "There was a problem signing in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
    } catch (error) {
      toast({
        title: "GitHub login failed",
        description: "There was a problem signing in with GitHub. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBypassLogin = () => {
    localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      authenticated: true
    }));
    
    window.location.href = '/dashboard';
    
    toast({
      title: "Bypassed login",
      description: "You've bypassed the login for testing purposes.",
    });
  };

  const handleToggleBypass = () => {
    toggleBypassAuth();
    toast({
      title: bypassAuthForTesting ? "Authentication enabled" : "Authentication bypassed",
      description: bypassAuthForTesting 
        ? "Normal authentication is now required" 
        : "You can now access all protected routes without authentication",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-professional-gray-light/50">
      <Card className="w-[400px] shadow-lg bg-gradient-professional">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign in</CardTitle>
          <CardDescription>
            Sign in to your account to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {import.meta.env.DEV && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-amber-800">Development Mode</h4>
                  <p className="text-xs text-amber-700 mt-1">
                    Toggle this switch to completely bypass authentication for all protected routes.
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-amber-700">
                      {bypassAuthForTesting ? "Auth bypass enabled" : "Auth bypass disabled"}
                    </span>
                    <Switch 
                      checked={bypassAuthForTesting} 
                      onCheckedChange={handleToggleBypass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleGoogleLogin}
            disabled={isLoading || bypassAuthForTesting}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Sign in with Google</span>
          </Button>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2" 
            onClick={handleGithubLogin}
            disabled={isLoading || bypassAuthForTesting}
          >
            <Github className="h-4 w-4" />
            <span>Sign in with GitHub</span>
          </Button>

          <div className="relative flex items-center justify-center">
            <Separator className="flex-1" />
            <div className="mx-4 text-sm text-muted-foreground">or</div>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading || bypassAuthForTesting}
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || bypassAuthForTesting}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || bypassAuthForTesting}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Sign in with Email</span>
                </div>
              )}
            </Button>
          </form>
          
          {import.meta.env.DEV && !bypassAuthForTesting && (
            <div className="mt-4">
              <Button 
                type="button" 
                variant="secondary" 
                className="w-full" 
                onClick={handleBypassLogin}
              >
                Bypass Login (Testing Only)
              </Button>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                This button only appears in development mode
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account? <a href="#" className="underline">Sign up</a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
