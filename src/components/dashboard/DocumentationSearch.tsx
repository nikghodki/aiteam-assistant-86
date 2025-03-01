
import { useState } from 'react';
import { Search, FileText, Clock } from 'lucide-react';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useQuery } from '@tanstack/react-query';
import { docsApi } from '@/services/api';

interface DocumentResult {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  url: string;
  category: string;
}

interface QueryHistoryItem {
  id: number;
  query: string;
  timestamp: string;
}

const DocumentationSearch = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryItem[]>([
    { id: 1, query: 'How to debug pod crashes?', timestamp: '2023-05-15 14:30' },
    { id: 2, query: 'Kubernetes RBAC best practices', timestamp: '2023-05-14 09:45' },
  ]);
  const [showHistory, setShowHistory] = useState(false);

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
      
      return docsApi.searchDocumentation(query);
    },
    enabled: false, // Don't run query on component mount
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setSelectedResult(null);

    // Add to query history
    const newHistoryItem = {
      id: Date.now(),
      query: query,
      timestamp: new Date().toLocaleString()
    };
    setQueryHistory(prev => [newHistoryItem, ...prev]);
    
    refetch();
  };

  const handleResultClick = (id: number) => {
    setSelectedResult(id);
    // Notify parent component or trigger another action if needed
    toast({
      title: "Document Selected",
      description: "Document selected for reference",
    });
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    setShowHistory(false);
  };

  return (
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
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-xs font-medium">Suggested topics:</div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
              <Clock size={14} />
              {showHistory ? 'Hide history' : 'View history'}
            </button>
          </div>
          
          {!showHistory && (
            <div className="mt-2 flex flex-wrap gap-2">
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
          )}
          
          {showHistory && (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {queryHistory.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleHistoryClick(item.query)}
                  className="w-full text-left p-2 text-xs border-b border-muted hover:bg-muted/50 transition-colors"
                >
                  <div className="truncate font-medium">{item.query}</div>
                  <div className="text-muted-foreground text-[10px] mt-1">{item.timestamp}</div>
                </button>
              ))}
              
              {queryHistory.length === 0 && (
                <div className="text-muted-foreground text-xs p-2">No search history yet</div>
              )}
            </div>
          )}
        </form>
      </div>
      
      {results && (
        <div className="divide-y">
          <div className="p-3 border-b bg-muted/40">
            <h3 className="font-medium text-xs flex items-center gap-2">
              <FileText size={14} className="text-primary" />
              <span>Search Results</span>
            </h3>
          </div>
          {results.map(result => (
            <button
              key={result.id}
              onClick={() => handleResultClick(result.id)}
              className={cn(
                "w-full text-left p-3 transition-colors hover:bg-muted/50",
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
      )}
    </GlassMorphicCard>
  );
};

export default DocumentationSearch;
