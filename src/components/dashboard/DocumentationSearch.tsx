
import { useState } from 'react';
import { Search, BookOpen, FileText, ExternalLink, ThumbsUp, ThumbsDown, AlertCircle } from 'lucide-react';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from '@tanstack/react-query';
import { docsApi } from '@/services/api';

const DocumentationSearch = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<number | null>(null);

  // Search documentation query
  const {
    data: results,
    isLoading: isLoadingResults,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['documentation', query],
    queryFn: async () => {
      if (!query.trim()) return null;
      
      // This would be a real API call in production
      // return docsApi.searchDocumentation(query);
      
      // For demo, return mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            {
              id: 1,
              title: 'Kubernetes Pod Debugging Guide',
              excerpt: 'Learn how to troubleshoot common Kubernetes pod issues including crash loops, pending states, and container failures.',
              content: `When debugging Kubernetes pods stuck in a CrashLoopBackOff state, follow these steps:

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
\`kubectl get events -n <namespace> --sort-by='.lastTimestamp'\``,
              url: '#',
              category: 'Kubernetes',
            },
            {
              id: 2,
              title: 'Access Control Best Practices',
              excerpt: 'A comprehensive guide to managing user access across your infrastructure with least privilege principles.',
              content: `# Access Control Best Practices

## Principle of Least Privilege

Always grant users the minimum level of access required to perform their job functions. This minimizes the attack surface and potential for accidental misuse.

## Regular Access Reviews

Conduct quarterly access reviews to ensure that:
- Users who have changed roles have appropriate permissions
- Departed employees have had access revoked
- Service accounts are still necessary and properly secured

## Role-Based Access Control (RBAC)

Implement RBAC for all systems:
- Define clear roles based on job functions
- Group permissions into these roles
- Assign users to appropriate roles
- Avoid direct permission assignments

## Just-in-Time Access

For sensitive systems, implement temporary elevated access that:
- Requires approval
- Has a limited time window
- Is fully audited
- Automatically expires

## Multi-Factor Authentication

Require MFA for all administrative access to critical systems.`,
              url: '#',
              category: 'Security',
            },
            {
              id: 3,
              title: 'Service Mesh Implementation',
              excerpt: 'Step-by-step guide to implementing a service mesh for enhanced microservice communication.',
              content: `# Service Mesh Implementation Guide

## Benefits of a Service Mesh

- Enhanced observability across services
- Consistent security policies
- Advanced traffic management
- Improved reliability through circuit breaking, retries, and timeouts

## Implementation Steps

1. **Evaluate Service Mesh Options**
   - Istio: Full-featured but complex
   - Linkerd: Lightweight and easy to adopt
   - Consul Connect: Works well with existing Consul deployments

2. **Start with a Pilot Project**
   - Choose a non-critical application
   - Deploy in a staging environment first
   - Focus on observability benefits initially

3. **Gradual Rollout**
   - Migrate services incrementally
   - Monitor performance impacts
   - Adjust resource allocations as needed

4. **Establish Governance**
   - Create standard configurations
   - Document best practices
   - Train teams on troubleshooting

## Common Pitfalls

- Underestimating resource requirements
- Implementing too many features at once
- Insufficient monitoring of the mesh itself
- Lack of expertise for troubleshooting`,
              url: '#',
              category: 'Architecture',
            }
          ]);
        }, 1200);
      });
    },
    enabled: false, // Don't run query on component mount
  });

  // Document detail query
  const {
    data: selectedDocument,
    isLoading: isLoadingDocument
  } = useQuery({
    queryKey: ['document', selectedResult],
    queryFn: async () => {
      if (selectedResult === null) return null;
      
      // This would be a real API call in production
      // return docsApi.getDocumentById(selectedResult);
      
      // For demo, filter from our mock results
      return new Promise((resolve) => {
        setTimeout(() => {
          if (results) {
            const doc = results.find(r => r.id === selectedResult);
            resolve(doc || null);
          } else {
            resolve(null);
          }
        }, 1000);
      });
    },
    enabled: selectedResult !== null,
  });

  // Feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: ({ documentId, helpful }: { documentId: number, helpful: boolean }) => {
      // This would be a real API call in production
      // return docsApi.submitFeedback(documentId, helpful);
      
      // For demo, just return success
      return Promise.resolve({ success: true });
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Feedback Submitted",
        description: `Thank you for your ${variables.helpful ? 'positive' : 'negative'} feedback`,
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setSelectedResult(null);
    refetch();
  };

  const handleResultClick = (id: number) => {
    setSelectedResult(id);
  };

  const submitFeedback = (helpful: boolean) => {
    if (selectedResult === null) return;
    
    feedbackMutation.mutate({
      documentId: selectedResult,
      helpful
    });
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
                  disabled={isLoadingResults || isRefetching}
                >
                  {isLoadingResults || isRefetching ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Search size={16} />
                  )}
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
          {isLoadingResults || isRefetching || isLoadingDocument ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                <span className="text-sm text-muted-foreground">
                  {isLoadingDocument ? 'Loading document...' : 'Searching documentation...'}
                </span>
              </div>
            </div>
          ) : selectedDocument ? (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-medium">{selectedDocument.title}</h2>
              
              <div className="prose prose-sm max-w-none">
                <pre className="p-4 bg-muted rounded-md text-sm whitespace-pre-wrap font-mono">
                  {selectedDocument.content}
                </pre>
              </div>
              
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <a href={selectedDocument.url} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ExternalLink size={14} />
                  <span>View full documentation</span>
                </a>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Was this helpful?</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => submitFeedback(true)}
                      disabled={feedbackMutation.isPending}
                      className="p-1 rounded-full hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button 
                      onClick={() => submitFeedback(false)}
                      disabled={feedbackMutation.isPending}
                      className="p-1 rounded-full hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                    >
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
