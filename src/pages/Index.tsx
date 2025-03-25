
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, Database, Server, Search, ArrowRight } from 'lucide-react';
import AnimatedIcon from '@/components/ui/AnimatedIcon';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { Layout } from '@/components/layout/Layout';

const features = [
  {
    title: 'Access Management',
    description: 'Streamline user access control across all your infrastructure systems.',
    icon: Database,
    delay: 200,
  },
  {
    title: 'Kubernetes Debugging',
    description: 'Quickly identify and resolve issues in your Kubernetes clusters.',
    icon: Server,
    delay: 400,
  },
  {
    title: 'Documentation Search',
    description: "Instant answers from your company's documentation and best practices.",
    icon: Search,
    delay: 600,
  },
];

const Index = () => {
  const navigate = useNavigate();

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

  return (
    <Layout>
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
                <span>SRE Assistant</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight animate-fade-in" style={{ animationDelay: '100ms' }}>
                Simplify Your <br />
                <span className="text-primary">Infrastructure</span> Management
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: '200ms' }}>
                An intelligent assistant for SREs and DevOps engineers to manage access, debug Kubernetes issues, and quickly find answers from documentation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-fade-in" style={{ animationDelay: '300ms' }}>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors hover:scale-105 flex items-center"
                >
                  <span>Get Started</span>
                  <ArrowRight size={16} className="ml-2" />
                </button>
                
                <button className="px-6 py-3 border border-input rounded-md font-medium hover:bg-muted transition-colors">
                  Learn More
                </button>
              </div>
            </div>
            
            <div className="relative animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="relative p-2 bg-gradient-to-br from-primary/20 to-transparent rounded-2xl">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
                    alt="SRE Assistant Dashboard"
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-transparent opacity-60"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="text-white font-medium mb-2">Terminal Output</div>
                    <div className="bg-black/70 backdrop-blur-sm p-3 rounded text-xs text-green-400 font-mono">
                      $ kubectl get pods -n monitoring<br />
                      NAME                 READY   STATUS    RESTARTS   AGE<br />
                      prometheus-0         1/1     Running   0          24h<br />
                      grafana-7df4f85b85   1/1     Running   0          24h
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
              Powerful Features for SREs
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
              Everything you need to manage and troubleshoot your infrastructure in one place
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <GlassMorphicCard key={index} className="p-6 animate-fade-in" style={{ animationDelay: `${feature.delay}ms` }}>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon size={24} className="text-primary" />
                </div>
                
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
                
                <button 
                  onClick={() => navigate('/dashboard')}
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
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <GlassMorphicCard className="bg-primary/5 overflow-hidden">
            <div className="relative p-8 md:p-12">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-32 -ml-32 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
              
              <div className="relative max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-fade-in">
                  Ready to streamline your infrastructure management?
                </h2>
                <p className="text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                  Join other SRE teams who have reduced debugging time by 70% and improved access management security with SRE Assistant.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 transition-colors hover:scale-105"
                  >
                    Get Started Now
                  </button>
                  
                  <button className="px-6 py-3 border border-input rounded-md font-medium hover:bg-muted transition-colors">
                    View Documentation
                  </button>
                </div>
              </div>
            </div>
          </GlassMorphicCard>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
