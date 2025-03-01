import { useState } from 'react';
import { Server, Database, Terminal, Search, RefreshCcw, Users, FileText, AlertCircle, Link } from 'lucide-react';
import AccessManagement from '@/components/dashboard/AccessManagement';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';
import DocumentationSearch from '@/components/dashboard/DocumentationSearch';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';

interface DashboardStats {
  clusters: number;
  groups: number;
  resolvedIssues: number;
  docQueries: number;
  jiraTickets: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { data: dashboardStats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      return new Promise<DashboardStats>((resolve) => {
        setTimeout(() => {
          resolve({
            clusters: 4,
            groups: 8,
            resolvedIssues: 128,
            docQueries: 356,
            jiraTickets: 42
          });
        }, 800);
      });
    },
    staleTime: 60000,
  });
  
  const stats = [
    { label: 'Active Clusters', value: dashboardStats?.clusters || '—', icon: Server, color: 'text-primary' },
    { label: 'Groups Memberships', value: dashboardStats?.groups || '—', icon: Users, color: 'text-green-500' },
    { label: 'Resolved Issues', value: dashboardStats?.resolvedIssues || '—', icon: Terminal, color: 'text-amber-500' },
    { label: 'Documentation Queries', value: dashboardStats?.docQueries || '—', icon: Search, color: 'text-purple-500' },
    { label: 'Jira Tickets', value: dashboardStats?.jiraTickets || '—', icon: Link, color: 'text-blue-500' },
  ];

  const recentActivities = [
    { type: 'access', message: 'Your access request to Security Team was approved', time: '2 hours ago' },
    { type: 'kubernetes', message: 'Debugging session OPS-127 was created', time: '1 day ago' },
    { type: 'documentation', message: 'You searched for "Kubernetes pod troubleshooting"', time: '2 days ago' },
    { type: 'access', message: 'You requested access to Database Admins group', time: '3 days ago' },
    { type: 'kubernetes', message: 'Issue with prod-api-gateway-78fd9 was resolved', time: '5 days ago' },
  ];

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Monitor and manage your infrastructure resources, access controls, and documentation.
          </p>
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
                  <span>{dashboardStats?.groups || '—'} groups</span>
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
                  <span>{dashboardStats?.clusters || '—'} clusters</span>
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
                  <span>{dashboardStats?.docQueries || '—'} queries</span>
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
                  <span>{dashboardStats?.jiraTickets || '—'} tickets</span>
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
