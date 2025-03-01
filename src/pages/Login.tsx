
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { Terminal, Lock, Mail, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Login = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';
  
  useEffect(() => {
    // If user is already logged in, redirect
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoggingIn(true);
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
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
        
        <form onSubmit={handleLogin} className="flex flex-col space-y-6">
          <div className="w-full p-6 bg-card rounded-md border border-border">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Lock size={18} />
              <h2 className="font-medium">Sign In</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <label htmlFor="password" className="text-sm font-medium">Password</label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : 'Sign In'}
              </Button>
            </div>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </GlassMorphicCard>
    </div>
  );
};

export default Login;
