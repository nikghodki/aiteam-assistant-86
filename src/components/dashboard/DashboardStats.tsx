
import { Server, Users, Terminal, Search, Link } from 'lucide-react';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { accessApi, kubernetesApi, docsApi, jiraApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface DashboardStats {
  clusters: number;
  groups: number;
  resolvedIssues: number;
  docQueries: number;
  jiraTickets: number;
}

const DashboardStats = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Get dynamic dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        // Fetch actual data from APIs
        const [clusters, groups, docHistory] = await Promise.all([
          kubernetesApi.getClusters(),
          accessApi.getUserGroups(user.name),
          docsApi.getQueryHistory(),
        ]);
        
        const jiraTickets = await jiraApi.getUserReportedTickets();
        
        return {
          clusters: clusters.length,
          groups: groups.length,
          resolvedIssues: 128, // Could be replaced with actual data
          docQueries: docHistory.length,
          jiraTickets: jiraTickets.length
        };
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        toast({
          title: "Error fetching dashboard stats",
          description: "Could not load dashboard statistics",
          variant: "destructive"
        });
        return {
          clusters: 0,
          groups: 0,
          resolvedIssues: 0,
          docQueries: 0,
          jiraTickets: 0
        };
      }
    },
    staleTime: 60000,
  });
  
  const stats = [
    { label: 'Active Clusters', value: dashboardStats?.clusters || '0', icon: Server, color: 'text-primary' },
    { label: 'Groups Memberships', value: dashboardStats?.groups || '0', icon: Users, color: 'text-green-500' },
    { label: 'Resolved Issues', value: dashboardStats?.resolvedIssues || '0', icon: Terminal, color: 'text-amber-500' },
    { label: 'Documentation Queries', value: dashboardStats?.docQueries || '0', icon: Search, color: 'text-purple-500' },
    { label: 'Jira Tickets', value: dashboardStats?.jiraTickets || '0', icon: Link, color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <GlassMorphicCard key={index} className="p-5 hover-scale transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            </div>
            <div className={cn("p-2 rounded-md bg-muted/80", stat.color)}>
              <stat.icon size={20} />
            </div>
          </div>
        </GlassMorphicCard>
      ))}
    </div>
  );
};

export default DashboardStats;
