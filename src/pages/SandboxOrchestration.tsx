
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash, Edit, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SandboxChat from '@/components/sandbox/SandboxChat';
import SandboxEditModal from '@/components/sandbox/SandboxEditModal';
import { toast } from 'sonner';
import { getSandboxes, deleteSandbox, refreshSandbox } from '@/services/sandboxApi';

interface Sandbox {
  id: string;
  name: string;
  status: 'stable' | 'provisioning' | 'error' | 'deleting';
  createdAt: string;
  services: Array<{
    name: string;
    imageTag: string;
    envVariables: Record<string, string>;
  }>;
}

const SandboxOrchestration = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSandbox, setSelectedSandbox] = useState<Sandbox | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Fetch sandboxes from the API
  const { data: sandboxes = [], isLoading, refetch } = useQuery({
    queryKey: ['sandboxes'],
    queryFn: getSandboxes,
  });

  // Filter sandboxes based on search term
  const filteredSandboxes = sandboxes.filter((sandbox: Sandbox) => 
    sandbox.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (sandboxId: string) => {
    try {
      await deleteSandbox(sandboxId);
      toast.success("Sandbox deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete sandbox");
      console.error(error);
    }
  };

  const handleRefresh = async (sandboxId: string) => {
    try {
      await refreshSandbox(sandboxId);
      toast.success("Refreshing sandbox status...");
      refetch();
    } catch (error) {
      toast.error("Failed to refresh sandbox status");
      console.error(error);
    }
  };

  const handleEdit = (sandbox: Sandbox) => {
    setSelectedSandbox(sandbox);
    setIsEditModalOpen(true);
  };

  // Status badge color mapping
  const getStatusBadgeColor = (status: Sandbox['status']) => {
    switch (status) {
      case 'stable': return 'bg-green-500';
      case 'provisioning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'deleting': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Sandbox Orchestration</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sandbox List Column */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>My Sandboxes</span>
                  <Badge variant="outline" className="ml-2">
                    {filteredSandboxes.length}
                  </Badge>
                </CardTitle>
                <Input
                  placeholder="Search sandboxes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </CardHeader>
              <CardContent className="overflow-y-auto max-h-[70vh]">
                {isLoading ? (
                  <div className="flex justify-center p-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredSandboxes.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    No sandboxes found. Use the chat interface to create one.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSandboxes.map((sandbox: Sandbox) => (
                      <Card key={sandbox.id} className="p-4 shadow-sm border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{sandbox.name}</h3>
                            <div className="flex mt-1 space-x-2 items-center">
                              <Badge className={getStatusBadgeColor(sandbox.status)}>
                                {sandbox.status}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Created: {new Date(sandbox.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                Services: {sandbox.services.length}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleRefresh(sandbox.id)}
                              title="Refresh Status"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(sandbox)}
                              title="Edit Sandbox"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(sandbox.id)}
                              className="text-red-500"
                              title="Delete Sandbox"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Chat Interface Column */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Sandbox Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <SandboxChat onSandboxCreated={refetch} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      {selectedSandbox && (
        <SandboxEditModal
          sandbox={selectedSandbox}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSandbox(null);
          }}
          onSave={() => {
            refetch();
            setIsEditModalOpen(false);
            setSelectedSandbox(null);
          }}
        />
      )}
    </Layout>
  );
};

export default SandboxOrchestration;
