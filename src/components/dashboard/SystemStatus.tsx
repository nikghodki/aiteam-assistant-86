
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { useQuery } from '@tanstack/react-query';
import { kubernetesApi } from '@/services/api';

const SystemStatus = () => {
  // Get clusters data to provide accurate counts
  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ['kubernetes-clusters'],
    queryFn: async () => {
      try {
        return await kubernetesApi.getClusters() || [];
      } catch (error) {
        console.error("Error fetching kubernetes clusters:", error);
        return [];
      }
    },
    staleTime: 60000,
  });

  const clusterCount = Array.isArray(clusters) ? clusters.length : 0;
  
  return (
    <GlassMorphicCard>
      <div className="p-5 border-b bg-muted/20">
        <h3 className="text-lg font-medium">System Status</h3>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Access System</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Kubernetes API</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingClusters 
                ? "Loading clusters..." 
                : clusterCount > 0 
                  ? `${clusterCount} clusters connected` 
                  : "No clusters available"}
            </p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Documentation</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">Indexed and up-to-date</p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Jira Integration</h4>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">Partial degradation</p>
          </div>
        </div>
      </div>
    </GlassMorphicCard>
  );
};

export default SystemStatus;
