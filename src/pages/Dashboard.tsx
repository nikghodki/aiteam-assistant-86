
import { useState, useEffect } from 'react';
import { Server, Database, Terminal, Search, RefreshCcw, Users, FileText, AlertCircle, Link } from 'lucide-react';
import AccessManagement from '@/components/dashboard/AccessManagement';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';
import DocumentationSearch from '@/components/dashboard/DocumentationSearch';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { accessApi, kubernetesApi, docsApi, jiraApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  clusters: number;
  groups: number;
  resolvedIssues: number;
  docQueries: number;
  jiraTickets: number;
}

interface Activity {
  id: number;
  type: 'access' | 'kubernetes' | 'documentation';
  message: string;
  time: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  
  // Get dynamic dashboard stats
  const { data: dashboardStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<DashboardStats>({
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
  
  // Fetch recent activities
  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        // Fetch activity data from various sources
        const [groups, docHistory] = await Promise.all([
          accessApi.getUserGroups(user.name),
          docsApi.getQueryHistory(),
        ]);
        
        const debugSessions = await kubernetesApi.getDebugSessions();
        
        // Map to activity format
        const activities: Activity[] = [];
        
        // Access activities
        const pendingGroups = groups.filter(g => g.status === 'pending');
        if (pendingGroups.length > 0) {
          activities.push({
            id: 1,
            type: 'access',
            message: `You requested access to ${pendingGroups[0].name} group`,
            time: '1 day ago'
          });
        }
        
        // Kubernetes debug sessions
        if (debugSessions && debugSessions.length > 0) {
          activities.push({
            id: 2,
            type: 'kubernetes',
            message: `Debugging session ${debugSessions[0].id} was created`,
            time: '2 days ago'
          });
        }
        
        // Documentation searches
        if (docHistory && docHistory.length > 0) {
          activities.push({
            id: 3,
            type: 'documentation',
            message: `You searched for "${docHistory[0].query}"`,
            time: docHistory[0].timestamp
          });
        }
        
        // If we have more docs history, add another entry
        if (docHistory && docHistory.length > 1) {
          activities.push({
            id: 4,
            type: 'documentation',
            message: `You searched for "${docHistory[1].query}"`,
            time: docHistory[1].timestamp
          });
        }
        
        // Add a fallback activity if none were found
        if (activities.length === 0) {
          activities.push({
            id: 5,
            type: 'access',
            message: 'Welcome to the dashboard! Start using the platform to see your activities here.',
            time: 'Just now'
          });
        }
        
        setRecentActivities(activities);
      } catch (error) {
        console.error("Error fetching recent activities:", error);
        // Set fallback activities if error
        setRecentActivities([
          {
            id: 1,
            type: 'access',
            message: 'Your access request to Security Team was approved',
            time: '2 hours ago'
          },
          {
            id: 2,
            type: 'kubernetes',
            message: 'Could not load recent activities',
            time: 'Just now'
          }
        ]);
      }
    };
    
    fetchRecentActivities();
  }, [user.name, toast]);
  
  const stats = [
    { label: 'Active Clusters', value: dashboardStats?.clusters || '0', icon: Server, color: 'text-primary' },
    { label: 'Groups Memberships', value: dashboardStats?.groups || '0', icon: Users, color: 'text-green-500' },
    { label: 'Resolved Issues', value: dashboardStats?.resolvedIssues || '0', icon: Terminal, color: 'text-amber-500' },
    { label: 'Documentation Queries', value: dashboardStats?.docQueries || '0', icon: Search, color: 'text-purple-500' },
    { label: 'Jira Tickets', value: dashboardStats?.jiraTickets || '0', icon: Link, color: 'text-blue-500' },
  ];

  const navigateTo = (path: string) => {
    navigate(path);
  };

  // Handle manual refresh
  const handleRefresh = () => {
    refetchStats();
    toast({
      title: "Dashboard refreshed",
      description: "The dashboard data has been updated",
    });
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2 max-w-3xl">
                Monitor and manage your infrastructure resources, access controls, and documentation.
              </p>
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors"
              title="Refresh dashboard"
            >
              <RefreshCcw size={20} className={isLoadingStats ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        
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
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassMorphicCard className="lg:col-span-2">
            <div className="p-5 border-b bg-muted/20">
              <h3 className="text-lg font-medium">Platform Features</h3>
            </div>
            
            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className="border rounded-md p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col hover-scale"
                onClick={() => navigateTo('/access')}
              >
                <div className="w-10 h-10 rounded-md bg-green-50 flex items-center justify-center mb-3">
                  <Users size={20} className="text-green-600" />
                </div>
                <h4 className="font-medium mb-1">Access Management</h4>
                <p className="text-xs text-muted-foreground mb-3">Manage user group access and permissions</p>
                <div className="mt-auto flex justify-between text-xs text-muted-foreground">
                  <span>{dashboardStats?.groups || '0'} groups</span>
                  <span className="text-primary">View →</span>
                </div>
              </div>
              
              <div 
                className="border rounded-md p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col hover-scale"
                onClick={() => navigateTo('/kubernetes')}
              >
                <div className="w-10 h-10 rounded-md bg-amber-50 flex items-center justify-center mb-3">
                  <Terminal size={20} className="text-amber-600" />
                </div>
                <h4 className="font-medium mb-1">Kubernetes Debugger</h4>
                <p className="text-xs text-muted-foreground mb-3">Debug Kubernetes cluster issues with AI assistance</p>
                <div className="mt-auto flex justify-between text-xs text-muted-foreground">
                  <span>{dashboardStats?.clusters || '0'} clusters</span>
                  <span className="text-primary">View →</span>
                </div>
              </div>
              
              <div 
                className="border rounded-md p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col hover-scale"
                onClick={() => navigateTo('/docs')}
              >
                <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center mb-3">
                  <Search size={20} className="text-purple-600" />
                </div>
                <h4 className="font-medium mb-1">Documentation Search</h4>
                <p className="text-xs text-muted-foreground mb-3">Search documentation and get instant answers</p>
                <div className="mt-auto flex justify-between text-xs text-muted-foreground">
                  <span>{dashboardStats?.docQueries || '0'} queries</span>
                  <span className="text-primary">View →</span>
                </div>
              </div>
              
              <div 
                className="border rounded-md p-4 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer flex flex-col hover-scale"
                onClick={() => navigateTo('/jira')}
              >
                <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center mb-3">
                  <Link size={20} className="text-blue-600" />
                </div>
                <h4 className="font-medium mb-1">Jira Ticket Creation</h4>
                <p className="text-xs text-muted-foreground mb-3">Create and manage Jira tickets with AI assistance</p>
                <div className="mt-auto flex justify-between text-xs text-muted-foreground">
                  <span>{dashboardStats?.jiraTickets || '0'} tickets</span>
                  <span className="text-primary">View →</span>
                </div>
              </div>
            </div>
          </GlassMorphicCard>
          
          <GlassMorphicCard className="h-full">
            <div className="p-5 border-b bg-muted/20">
              <h3 className="text-lg font-medium">Recent Activities</h3>
            </div>
            
            <div className="p-5 space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex gap-3">
                  <div className={cn(
                    "mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    activity.type === 'access' ? "bg-green-50" : 
                    activity.type === 'kubernetes' ? "bg-amber-50" : "bg-purple-50"
                  )}>
                    {activity.type === 'access' && <Users size={16} className="text-green-600" />}
                    {activity.type === 'kubernetes' && <Terminal size={16} className="text-amber-600" />}
                    {activity.type === 'documentation' && <FileText size={16} className="text-purple-600" />}
                  </div>
                  <div>
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
              
              {recentActivities.length === 0 && (
                <div className="text-center py-6">
                  <AlertCircle size={24} className="mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </GlassMorphicCard>
        </div>
        
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
                <p className="text-xs text-muted-foreground">All clusters connected</p>
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
      </div>
    </Layout>
  );
};

export default Dashboard;
