
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
  
  // Get clusters data
  const { data: clusters, isLoading: isLoadingClusters } = useQuery({
    queryKey: ['kubernetes-clusters'],
    queryFn: () => kubernetesApi.getClusters(),
    staleTime: 60000,
  });

  // Get user groups data
  const { data: groups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['user-groups', user?.name],
    queryFn: () => user?.name ? accessApi.getUserGroups(user.name) : Promise.resolve([]),
    enabled: !!user?.name,
    staleTime: 60000,
  });

  // Get documentation query history
  const { data: docHistory, isLoading: isLoadingDocHistory } = useQuery({
    queryKey: ['doc-history'],
    queryFn: () => docsApi.getQueryHistory(),
    staleTime: 60000,
    onError: (error) => {
      console.error("Error fetching documentation history:", error);
    }
  });

  // Get Jira tickets
  const { data: jiraTickets, isLoading: isLoadingJiraTickets } = useQuery({
    queryKey: ['jira-tickets'],
    queryFn: () => jiraApi.getUserReportedTickets(),
    staleTime: 60000,
    onError: (error) => {
      console.error("Error fetching Jira tickets:", error);
    }
  });

  const isLoading = isLoadingClusters || isLoadingGroups || isLoadingDocHistory || isLoadingJiraTickets;

  // Use actual data from the queries
  const statsData = {
    clusters: clusters?.length || 0,
    groups: groups?.length || 0,
    resolvedIssues: 128, // This is still hardcoded as in the original
    docQueries: docHistory?.length || 0,
    jiraTickets: jiraTickets?.length || 0
  };

  const stats = [
    { label: 'Active Clusters', value: statsData.clusters, icon: Server, color: 'text-primary' },
    { label: 'Groups Memberships', value: statsData.groups, icon: Users, color: 'text-green-500' },
    { label: 'Resolved Issues', value: statsData.resolvedIssues, icon: Terminal, color: 'text-amber-500' },
    { label: 'Documentation Queries', value: statsData.docQueries, icon: Search, color: 'text-purple-500' },
    { label: 'Jira Tickets', value: statsData.jiraTickets, icon: Link, color: 'text-blue-500' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {stats.map((stat, index) => (
        <GlassMorphicCard key={index} className="p-5 hover-scale transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1">
                {isLoading ? '...' : stat.value.toString()}
              </h3>
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
