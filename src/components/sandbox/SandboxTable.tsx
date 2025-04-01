
import React, { useState } from 'react';
import { Sandbox } from '@/services/sandboxApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Server, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sandboxApi } from '@/services/sandboxApi';

interface SandboxTableProps {
  sandboxes: Sandbox[];
  onSandboxDelete: (id: string) => void;
  onSelectSandbox: (sandbox: Sandbox) => void;
  selectedSandboxId?: string;
  isLoading: boolean;
}

const SandboxTable: React.FC<SandboxTableProps> = ({
  sandboxes,
  onSandboxDelete,
  onSelectSandbox,
  selectedSandboxId,
  isLoading
}) => {
  const { toast } = useToast();
  const [showDemos, setShowDemos] = useState(sandboxes.length === 0);

  const demoSandboxes: Sandbox[] = [
    {
      id: 'demo-web-app',
      name: 'Web Application Stack',
      status: 'stable',
      createdAt: new Date().toISOString(),
      services: [
        { name: 'frontend', image: 'nginx:latest', status: 'running', environmentVariables: [] },
        { name: 'api', image: 'node:16', status: 'running', environmentVariables: [] },
        { name: 'database', image: 'postgres:13', status: 'running', environmentVariables: [] }
      ]
    },
    {
      id: 'demo-data-science',
      name: 'Data Science Workbench',
      status: 'stable',
      createdAt: new Date().toISOString(),
      services: [
        { name: 'jupyter', image: 'jupyter/datascience-notebook:latest', status: 'running', environmentVariables: [] },
        { name: 'postgres', image: 'postgres:13', status: 'running', environmentVariables: [] }
      ]
    },
    {
      id: 'demo-microservices',
      name: 'Microservices Demo',
      status: 'stable',
      createdAt: new Date().toISOString(),
      services: [
        { name: 'gateway', image: 'nginx:latest', status: 'running', environmentVariables: [] },
        { name: 'auth-service', image: 'node:16', status: 'running', environmentVariables: [] },
        { name: 'user-service', image: 'node:16', status: 'running', environmentVariables: [] },
        { name: 'product-service', image: 'node:16', status: 'running', environmentVariables: [] },
        { name: 'mongodb', image: 'mongo:5', status: 'running', environmentVariables: [] }
      ]
    }
  ];

  const handleDeleteSandbox = async (id: string) => {
    try {
      await sandboxApi.deleteSandbox(id);
      onSandboxDelete(id);
      toast({
        title: "Sandbox deleted",
        description: "The sandbox has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting sandbox:', error);
      toast({
        title: "Error",
        description: "Failed to delete the sandbox.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-professional-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (sandboxes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="border border-dashed border-gray-300 h-64 flex flex-col items-center justify-center rounded-md">
          <div className="text-center p-6">
            <Server className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No sandboxes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new sandbox using the chat assistant or using a template.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-base mb-3">Sandbox Templates</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoSandboxes.map((sandbox) => (
                <TableRow 
                  key={sandbox.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectSandbox(sandbox)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {sandbox.name}
                      <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="h-3 w-3 mr-1" /> 
                        Demo
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default">{sandbox.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {sandbox.services.map((service, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-xs">{service.name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-professional-purple-dark border-professional-purple-dark hover:bg-professional-purple-light/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSandbox(sandbox);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" /> 
                      Use Template
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Services</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sandboxes.map((sandbox) => (
              <TableRow 
                key={sandbox.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  selectedSandboxId === sandbox.id && "bg-muted"
                )}
                onClick={() => onSelectSandbox(sandbox)}
              >
                <TableCell className="font-medium">{sandbox.name}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      sandbox.status === 'stable' ? 'default' :
                      sandbox.status === 'initializing' ? 'outline' :
                      sandbox.status === 'error' ? 'destructive' : 'secondary'
                    }
                  >
                    {sandbox.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col space-y-1">
                    {sandbox.services.map((service, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-xs">{service.name}</span>
                        <Badge variant="outline" className="text-xs py-0 px-1">
                          {service.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(sandbox.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-professional-purple-dark border-professional-purple-dark hover:bg-professional-purple-light/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSandbox(sandbox);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-destructive border-destructive hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Confirm Deletion</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete the sandbox "{sandbox.name}"? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button 
                              variant="destructive"
                              onClick={() => handleDeleteSandbox(sandbox.id)}
                            >
                              Delete
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="pt-2 border-t">
        <Button 
          variant="link" 
          className="p-0 h-auto text-sm text-muted-foreground" 
          onClick={() => setShowDemos(!showDemos)}
        >
          {showDemos ? "Hide templates" : "Show sandbox templates"}
        </Button>
      </div>

      {showDemos && (
        <div className="mt-4">
          <h3 className="font-medium text-base mb-3">Sandbox Templates</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoSandboxes.map((sandbox) => (
                <TableRow 
                  key={sandbox.id}
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelectSandbox(sandbox)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {sandbox.name}
                      <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                        <Star className="h-3 w-3 mr-1" /> 
                        Demo
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-1">
                      {sandbox.services.map((service, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-xs">{service.name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-professional-purple-dark border-professional-purple-dark hover:bg-professional-purple-light/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSandbox(sandbox);
                      }}
                    >
                      <Star className="h-4 w-4 mr-1" /> 
                      Use Template
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SandboxTable;
