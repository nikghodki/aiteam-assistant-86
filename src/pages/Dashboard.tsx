
import { useState } from 'react';
import { Server, Database, Terminal, Search, RefreshCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AccessManagement from '@/components/dashboard/AccessManagement';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';
import DocumentationSearch from '@/components/dashboard/DocumentationSearch';
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock data for the dashboard
  const stats = [
    { label: 'Active Clusters', value: '4', icon: Server, color: 'text-primary' },
    { label: 'Users Managed', value: '42', icon: Database, color: 'text-green-500' },
    { label: 'Resolved Issues', value: '128', icon: Terminal, color: 'text-amber-500' },
    { label: 'Documentation Queries', value: '356', icon: Search, color: 'text-purple-500' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor and manage your infrastructure
              </p>
            </div>
            
            <button className="flex items-center gap-2 text-sm bg-muted px-4 py-2 rounded-md hover:bg-muted/80 transition-colors self-start">
              <RefreshCcw size={16} />
              <span>Refresh Data</span>
            </button>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <GlassMorphicCard key={index} className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-muted-foreground text-sm">{stat.label}</p>
                    <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                  <div className={cn("p-2 rounded-md bg-muted", stat.color)}>
                    <stat.icon size={20} />
                  </div>
                </div>
              </GlassMorphicCard>
            ))}
          </div>
          
          {/* Tabs Navigation */}
          <div className="border-b">
            <nav className="-mb-px flex space-x-6 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview', icon: Server },
                { id: 'access', label: 'Access Management', icon: Database },
                { id: 'kubernetes', label: 'Kubernetes Debugger', icon: Terminal },
                { id: 'docs', label: 'Documentation', icon: Search },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <AccessManagement />
                <KubernetesDebugger />
              </div>
            )}
            
            {activeTab === 'access' && <AccessManagement />}
            
            {activeTab === 'kubernetes' && <KubernetesDebugger />}
            
            {activeTab === 'docs' && <DocumentationSearch />}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
