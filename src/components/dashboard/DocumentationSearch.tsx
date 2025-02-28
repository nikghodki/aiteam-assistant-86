
import { useState } from 'react';
import { Search, BookOpen, FileText, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';

const mockResults = [
  {
    id: 1,
    title: 'Kubernetes Pod Debugging Guide',
    excerpt: 'Learn how to troubleshoot common Kubernetes pod issues including crash loops, pending states, and container failures.',
    url: '#',
    category: 'Kubernetes',
  },
  {
    id: 2,
    title: 'Access Control Best Practices',
    excerpt: 'A comprehensive guide to managing user access across your infrastructure with least privilege principles.',
    url: '#',
    category: 'Security',
  },
  {
    id: 3,
    title: 'Service Mesh Implementation',
    excerpt: 'Step-by-step guide to implementing a service mesh for enhanced microservice communication.',
    url: '#',
    category: 'Architecture',
  },
];

const DocumentationSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<typeof mockResults | null>(null);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setResults(null);
    setSelectedResult(null);
    setAnswer('');
    
    // Simulate API call to backend
    setTimeout(() => {
      setResults(mockResults);
      setLoading(false);
    }, 1200);
  };

  const handleResultClick = (id: number) => {
    setSelectedResult(id);
    setLoading(true);
    
    // Simulate API call for answer generation
    setTimeout(() => {
      setAnswer(
        `When debugging Kubernetes pods stuck in a CrashLoopBackOff state, follow these steps:

1. First, check the pod logs:
   \`kubectl logs <pod-name> -n <namespace>\`

2. If you need previous container logs:
   \`kubectl logs <pod-name> -n <namespace> --previous\`

3. Examine pod details:
   \`kubectl describe pod <pod-name> -n <namespace>\`

4. Common issues to look for:
   - Misconfigured resources (CPU/memory limits)
   - Missing configuration or secrets
   - Application errors
   - Liveness/readiness probe failures

5. For deeper investigation, you can use:
   \`kubectl debug <pod-name> -n <namespace> --image=busybox --target=<container-name>\`

Remember to check events in the namespace for additional context:
\`kubectl get events -n <namespace> --sort-by='.lastTimestamp'\``
      );
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-6">
        <GlassMorphicCard>
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Search size={16} className="text-primary" />
              <span>Documentation Search</span>
            </h3>
          </div>
          
          <div className="p-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  placeholder="Search documentation..."
                />
                <button 
                  type="submit"
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  <Search size={16} />
                </button>
              </div>
              
              <div className="mt-4">
                <div className="text-xs font-medium mb-2">Suggested topics:</div>
                <div className="flex flex-wrap gap-2">
                  {['Kubernetes', 'Access Control', 'Debugging', 'Monitoring'].map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setQuery(topic)}
                      className="px-2 py-1 bg-muted rounded-md text-xs hover:bg-muted/80 transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </GlassMorphicCard>
        
        {results && (
          <GlassMorphicCard className="animate-fade-in">
            <div className="p-4 border-b bg-muted/40">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span>Search Results</span>
              </h3>
            </div>
            
            <div className="divide-y">
              {results.map(result => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.id)}
                  className={cn(
                    "w-full text-left p-4 transition-colors hover:bg-muted/50",
                    selectedResult === result.id && "bg-primary/5 hover:bg-primary/10"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{result.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.excerpt}</p>
                    </div>
                    
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {result.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </GlassMorphicCard>
        )}
      </div>
      
      <GlassMorphicCard className="md:col-span-2 flex flex-col">
        <div className="p-4 border-b bg-muted/40">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            <span>Documentation Answer</span>
          </h3>
        </div>
        
        <div className="flex-1 p-6">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm text-muted-foreground">
                  {results ? 'Generating answer...' : 'Searching documentation...'}
                </span>
              </div>
            </div>
          ) : answer ? (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-medium">
                {results?.find(r => r.id === selectedResult)?.title}
              </h2>
              
              <div className="prose prose-sm max-w-none">
                <pre className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono">
                  {answer}
                </pre>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <a href="#" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={14} />
                  <span>View full documentation</span>
                </a>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Was this helpful?</span>
                  <div className="flex items-center gap-2">
                    <button className="p-1 rounded-full hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors">
                      <ThumbsUp size={16} />
                    </button>
                    <button className="p-1 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                      <ThumbsDown size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <BookOpen size={48} className="text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium mb-2">Search Documentation</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Ask any question about access management, Kubernetes debugging, or search our documentation for answers.
              </p>
            </div>
          )}
        </div>
      </GlassMorphicCard>
    </div>
  );
};

export default DocumentationSearch;
