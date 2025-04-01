
import React from 'react';
import { Sandbox } from '@/services/sandboxApi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3, Server } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sandboxApi } from '@/services/sandboxApi';

interface SandboxListProps {
  sandboxes: Sandbox[];
  onSandboxDelete: (id: string) => void;
  onSelectSandbox: (sandbox: Sandbox) => void;
  selectedSandboxId?: string;
  isLoading: boolean;
}

const SandboxList: React.FC<SandboxListProps> = ({
  sandboxes,
  onSandboxDelete,
  onSelectSandbox,
  selectedSandboxId,
  isLoading
}) => {
  const { toast } = useToast();

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
      <Card className="border border-dashed border-gray-300 h-64 flex flex-col items-center justify-center">
        <div className="text-center p-6">
          <Server className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No sandboxes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new sandbox using the chat assistant.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sandboxes.map((sandbox) => (
        <Card 
          key={sandbox.id} 
          className={cn(
            "cursor-pointer hover:border-professional-purple transition-colors",
            selectedSandboxId === sandbox.id && "border-professional-purple"
          )}
          onClick={() => onSelectSandbox(sandbox)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{sandbox.name}</CardTitle>
                <CardDescription className="text-xs">
                  Created on {new Date(sandbox.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge
                variant={
                  sandbox.status === 'stable' ? 'default' :
                  sandbox.status === 'initializing' ? 'outline' :
                  sandbox.status === 'error' ? 'destructive' : 'secondary'
                }
              >
                {sandbox.status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">Services ({sandbox.services.length})</p>
              <div className="space-y-1">
                {sandbox.services.map((service, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">{service.name}</span>
                    <Badge variant={service.status === 'running' ? 'default' : service.status === 'pending' ? 'outline' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2">
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SandboxList;
