
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash, X } from "lucide-react";
import { toast } from 'sonner';
import { updateSandbox } from '@/services/sandboxApi';
import { Badge } from '@/components/ui/badge';

interface Service {
  name: string;
  imageTag: string;
  envVariables: Record<string, string>;
}

interface Sandbox {
  id: string;
  name: string;
  status: 'stable' | 'provisioning' | 'error' | 'deleting';
  createdAt: string;
  services: Service[];
}

interface SandboxEditModalProps {
  sandbox: Sandbox;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const SandboxEditModal = ({ sandbox, isOpen, onClose, onSave }: SandboxEditModalProps) => {
  const [name, setName] = useState(sandbox.name);
  const [services, setServices] = useState<Service[]>([...sandbox.services]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(sandbox.name);
      setServices([...sandbox.services]);
    }
  }, [isOpen, sandbox]);

  const handleServiceNameChange = (index: number, value: string) => {
    const newServices = [...services];
    newServices[index].name = value;
    setServices(newServices);
  };

  const handleImageTagChange = (index: number, value: string) => {
    const newServices = [...services];
    newServices[index].imageTag = value;
    setServices(newServices);
  };

  const handleAddService = () => {
    setServices([...services, { name: '', imageTag: 'latest', envVariables: {} }]);
  };

  const handleRemoveService = (index: number) => {
    const newServices = [...services];
    newServices.splice(index, 1);
    setServices(newServices);
  };

  const handleAddEnvVariable = (serviceIndex: number) => {
    const newServices = [...services];
    const service = newServices[serviceIndex];
    const newKey = `ENV_VAR_${Object.keys(service.envVariables).length + 1}`;
    service.envVariables[newKey] = '';
    setServices(newServices);
  };

  const handleRemoveEnvVariable = (serviceIndex: number, key: string) => {
    const newServices = [...services];
    const service = newServices[serviceIndex];
    const { [key]: removed, ...rest } = service.envVariables;
    service.envVariables = rest;
    setServices(newServices);
  };

  const handleEnvVariableChange = (serviceIndex: number, key: string, newKey: string, value: string) => {
    const newServices = [...services];
    const service = newServices[serviceIndex];
    
    // If the key changed, we need to remove the old key and add a new one
    if (key !== newKey) {
      const { [key]: removed, ...rest } = service.envVariables;
      service.envVariables = { ...rest, [newKey]: value };
    } else {
      service.envVariables[key] = value;
    }
    
    setServices(newServices);
  };

  const handleSave = async () => {
    // Validate inputs
    if (name.trim() === '') {
      toast.error('Sandbox name cannot be empty');
      return;
    }

    for (const service of services) {
      if (service.name.trim() === '') {
        toast.error('Service name cannot be empty');
        return;
      }
      if (service.imageTag.trim() === '') {
        toast.error('Image tag cannot be empty');
        return;
      }
    }

    setIsLoading(true);
    try {
      await updateSandbox(sandbox.id, {
        name,
        services,
      });
      toast.success('Sandbox updated successfully');
      onSave();
    } catch (error) {
      console.error('Error updating sandbox:', error);
      toast.error('Failed to update sandbox');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sandbox: {sandbox.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Sandbox Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sandbox name"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between items-center">
              <Label>Services</Label>
              <Badge variant="outline">{services.length}</Badge>
            </div>
            
            <div className="space-y-4">
              {services.map((service, serviceIndex) => (
                <Card key={serviceIndex}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Service #{serviceIndex + 1}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveService(serviceIndex)}
                        className="text-red-500 h-8 w-8"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <Label htmlFor={`service-name-${serviceIndex}`}>Service Name</Label>
                        <Input
                          id={`service-name-${serviceIndex}`}
                          value={service.name}
                          onChange={(e) => handleServiceNameChange(serviceIndex, e.target.value)}
                          placeholder="e.g., api-service"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`image-tag-${serviceIndex}`}>Image Tag</Label>
                        <Input
                          id={`image-tag-${serviceIndex}`}
                          value={service.imageTag}
                          onChange={(e) => handleImageTagChange(serviceIndex, e.target.value)}
                          placeholder="e.g., latest, v1.2.3"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Environment Variables</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddEnvVariable(serviceIndex)}
                          className="h-8"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Add Env Var
                        </Button>
                      </div>
                      
                      {Object.keys(service.envVariables).length === 0 ? (
                        <p className="text-sm text-muted-foreground py-2">
                          No environment variables defined
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {Object.entries(service.envVariables).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-[1fr,1fr,auto] gap-2">
                              <Input
                                value={key}
                                onChange={(e) => handleEnvVariableChange(
                                  serviceIndex,
                                  key,
                                  e.target.value,
                                  service.envVariables[key]
                                )}
                                placeholder="KEY"
                              />
                              <Input
                                value={value}
                                onChange={(e) => handleEnvVariableChange(
                                  serviceIndex,
                                  key,
                                  key,
                                  e.target.value
                                )}
                                placeholder="value"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveEnvVariable(serviceIndex, key)}
                                className="text-red-500 h-9 w-9"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleAddService}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SandboxEditModal;
