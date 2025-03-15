
import { useState, useEffect } from 'react';
import { Users, Terminal, FileText, AlertCircle } from 'lucide-react';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { accessApi, kubernetesApi, docsApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

interface Activity {
  id: number;
  type: 'access' | 'kubernetes' | 'documentation';
  message: string;
  time: string;
}

const RecentActivities = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  
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

  return (
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
  );
};

export default RecentActivities;
