
import { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from '@/components/dashboard/DashboardStats';
import PlatformFeatures from '@/components/dashboard/PlatformFeatures';
import RecentActivities from '@/components/dashboard/RecentActivities';
import SystemStatus from '@/components/dashboard/SystemStatus';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Handle manual refresh of all dashboard data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // Invalidate all relevant queries to trigger refetches
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['kubernetes-clusters'] }),
        queryClient.invalidateQueries({ queryKey: ['user-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['doc-history'] }),
        queryClient.invalidateQueries({ queryKey: ['jira-tickets'] }),
        queryClient.invalidateQueries({ queryKey: ['recent-activities'] })
      ]);
      
      // Manually dispatch event for any non-React Query components
      window.dispatchEvent(new CustomEvent('dashboard:refresh'));
      
      toast({
        title: "Dashboard refreshed",
        description: "The dashboard data has been updated",
      });
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast({
        title: "Refresh failed",
        description: "Could not refresh some dashboard data",
        variant: "destructive"
      });
    } finally {
      // Show spinner for at least a second for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
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
              <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
        
        {/* Dashboard Stats Cards */}
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Features */}
          <PlatformFeatures />
          
          {/* Recent Activities */}
          <RecentActivities />
        </div>
        
        {/* System Status */}
        <SystemStatus />
      </div>
    </Layout>
  );
};

export default Dashboard;
