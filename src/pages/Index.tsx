
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Database, Server, Search, ArrowRight, Github, Code, Cpu } from 'lucide-react';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    title: 'AI-Powered Access Management',
    description: 'Smart access control across infrastructure systems using machine learning.',
    icon: Database,
    delay: 200,
  },
  {
    title: 'Intelligent Kubernetes Debugging',
    description: 'AI-assisted troubleshooting that learns from past issues to speed resolution.',
    icon: Server,
    delay: 400,
  },
  {
    title: 'Smart Documentation Search',
    description: "Contextual AI search that understands your team's documentation and best practices.",
    icon: Search,
    delay: 600,
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { loginWithGithub, user } = useAuth();

  // Adding subtle background scroll effect for depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollValue = window.scrollY;
      const heroElement = document.getElementById('hero-bg');
      
      if (heroElement) {
        heroElement.style.transform = `translateY(${scrollValue * 0.15}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGithubLogin = async () => {
    try {
      await loginWithGithub();
    } catch (error) {
      console.error('GitHub login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* GitHub login button in the top right */}
      <div className="fixed top-4 right-4 z-50">
        {!user.authenticated ? (
          <Button 
            onClick={handleGithubLogin} 
            className="px-4 py-2 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-md"
          >
            <Github size={18} />
            <span>Login with GitHub</span>
          </Button>
        ) : (
          <Button 
            onClick={() => navigate('/dashboard')} 
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
          >
            Go to Dashboard
          </Button>
        )}
      </div>

      {/* Hero Section */}
      <section className="pt-8 pb-16 md:pt-12 md:pb-24 relative overflow-hidden">
        <div 
          id="hero-bg" 
          className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10"
        ></div>
        
        <div className="max-w-7xl mx-auto relative z-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-start space-y-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2 animate-fade-in">
                <Terminal size={16} className="mr-2" />
                <span>AI Software and Platform Team</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
                AI-Powered <br />
                <span className="text-primary">Infrastructure</span> Automation
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                Boosting productivity with intelligent tools that automate infrastructure management, Kubernetes debugging, and documentation search for the AI Software and Platform team.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                {user.authenticated ? (
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors hover-scale flex items-center"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      onClick={handleGithubLogin} 
                      className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors hover-scale flex items-center"
                    >
                      <Github size={16} className="mr-2" />
                      <span>Login with GitHub</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <div className="relative animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="relative p-2 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7"
                    alt="AI Platform Assistant Dashboard"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="text-white font-medium mb-2">AI-Assisted Terminal</div>
                    <div className="bg-black/70 backdrop-blur-sm p-3 rounded text-xs text-green-400 font-mono">
                      $ ai analyze --cluster prod-east<br />
                      Analyzing cluster performance...<br />
                      AI RECOMMENDATION: Scale up node group 'app-tier' by 2 instances<br />
                      Apply changes? [Y/n] _
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements for visual interest */}
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-primary/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/20 rounded-full blur-xl"></div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
              AI-Powered Tools for Platform Teams
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              Purpose-built automation to streamline operations and boost productivity
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassMorphicCard key={index} className={`p-6 animate-fade-in delay-${feature.delay}`}>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary" />
                </div>
                
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
                
                <button 
                  onClick={user.authenticated ? () => navigate('/dashboard') : handleGithubLogin}
                  className="mt-6 text-primary text-sm font-medium flex items-center hover:text-primary/80 transition-colors"
                >
                  <span>Learn more</span>
                  <ArrowRight size={14} className="ml-1" />
                </button>
              </GlassMorphicCard>
            ))}
          </div>
        </div>
      </section>
      
      {/* Tech Stack Section - New! */}
      <section className="py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Our AI Technology Stack</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge AI and machine learning technologies
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Cpu size={32} className="text-blue-600" />
              </div>
              <h3 className="font-medium mb-1">Machine Learning</h3>
              <p className="text-sm text-muted-foreground">Predictive analytics for infrastructure</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-purple-50 flex items-center justify-center mb-4">
                <Code size={32} className="text-purple-600" />
              </div>
              <h3 className="font-medium mb-1">Natural Language</h3>
              <p className="text-sm text-muted-foreground">Understanding context and intent</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <Server size={32} className="text-green-600" />
              </div>
              <h3 className="font-medium mb-1">Neural Networks</h3>
              <p className="text-sm text-muted-foreground">Deep learning for complex problems</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                <Database size={32} className="text-amber-600" />
              </div>
              <h3 className="font-medium mb-1">Knowledge Graphs</h3>
              <p className="text-sm text-muted-foreground">Connecting data intelligently</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <GlassMorphicCard className="bg-primary/5 overflow-hidden">
            <div className="relative p-8 md:p-12">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
              
              <div className="relative max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
                  Ready to boost your team's productivity?
                </h2>
                <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Join the AI Software and Platform team in using our specialized assistant to automate infrastructure tasks and increase productivity across your projects.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <button 
                    onClick={user.authenticated ? () => navigate('/dashboard') : handleGithubLogin}
                    className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors hover-scale"
                  >
                    {user.authenticated ? "Go to Dashboard" : "Get Started with GitHub"}
                  </button>
                </div>
              </div>
            </div>
          </GlassMorphicCard>
        </div>
      </section>
    </div>
  );
};

export default Index;
