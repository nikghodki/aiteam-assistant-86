
import { Users, Terminal, Search, Link } from 'lucide-react';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accessApi, kubernetesApi, docsApi, jiraApi } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const PlatformFeatures = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get counts from APIs for display in the cards
  const { data: groups } = useQuery({
    queryKey: ['user-groups', user.name],
    queryFn: () => accessApi.getUserGroups(user.name),
  });
  
  const { data: clusters } = useQuery({
    queryKey: ['kubernetes-clusters'],
    queryFn: () => kubernetesApi.getClusters(),
  });
  
  const { data: docHistory } = useQuery({
    queryKey: ['doc-history'],
    queryFn: () => docsApi.getQueryHistory(),
  });
  
  const { data: jiraTickets } = useQuery({
    queryKey: ['jira-tickets'],
    queryFn: () => jiraApi.getUserReportedTickets(),
  });

  const navigateTo = (path: string) => {
    navigate(path);
  };

  return (
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
            <span>{groups?.length || '0'} groups</span>
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
            <span>{clusters?.length || '0'} clusters</span>
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
            <span>{docHistory?.length || '0'} queries</span>
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
            <span>{jiraTickets?.length || '0'} tickets</span>
            <span className="text-primary">View →</span>
          </div>
        </div>
      </div>
    </GlassMorphicCard>
  );
};

export default PlatformFeatures;
