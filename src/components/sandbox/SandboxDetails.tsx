
import { useState, useEffect } from 'react';
import { Sandbox, SandboxService, sandboxApi } from '@/services/sandboxApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Plus, X, Save } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface SandboxDetailsProps {
  sandbox: Sandbox;
  onSandboxUpdated: () => void;
}

// Define schema for form validation
const sandboxFormSchema = z.object({
  name: z.string().min(3, { message: 'Sandbox name must be at least 3 characters' }),
  services: z.array(
    z.object({
      name: z.string().min(3, { message: 'Service name must be at least 3 characters' }),
      image: z.string().min(5, { message: 'Image name must be at least 5 characters' }),
      environmentVariables: z.array(
        z.object({
          name: z.string().min(1, { message: 'Environment variable name is required' }),
          value: z.string().min(1, { message: 'Environment variable value is required' }),
        })
      ),
    })
  ),
});

type SandboxFormValues = z.infer<typeof sandboxFormSchema>;

const SandboxDetails: React.FC<SandboxDetailsProps> = ({ sandbox, onSandboxUpdated }) => {
  const { toast } = useToast();
  
  const form = useForm<SandboxFormValues>({
    resolver: zodResolver(sandboxFormSchema),
    defaultValues: {
      name: sandbox.name,
      services: sandbox.services.map(service => ({
        name: service.name,
        image: service.image,
        environmentVariables: service.environmentVariables || [],
      })),
    },
  });

  // Update form when sandbox changes
  useEffect(() => {
    form.reset({
      name: sandbox.name,
      services: sandbox.services.map(service => ({
        name: service.name,
        image: service.image,
        environmentVariables: service.environmentVariables || [],
      })),
    });
  }, [sandbox, form]);

  const addService = () => {
    const services = form.getValues().services || [];
    form.setValue('services', [...services, { name: '', image: '', environmentVariables: [] }]);
  };

  const removeService = (index: number) => {
    const services = form.getValues().services;
    form.setValue('services', services.filter((_, i) => i !== index));
  };

  const addEnvVar = (serviceIndex: number) => {
    const services = form.getValues().services;
    const envVars = services[serviceIndex].environmentVariables || [];
    const updatedServices = [...services];
    updatedServices[serviceIndex].environmentVariables = [...envVars, { name: '', value: '' }];
    form.setValue('services', updatedServices);
  };

  const removeEnvVar = (serviceIndex: number, envVarIndex: number) => {
    const services = form.getValues().services;
    const updatedServices = [...services];
    updatedServices[serviceIndex].environmentVariables = 
      services[serviceIndex].environmentVariables.filter((_, i) => i !== envVarIndex);
    form.setValue('services', updatedServices);
  };

  const onSubmit = async (values: SandboxFormValues) => {
    try {
      await sandboxApi.updateSandbox({
        id: sandbox.id,
        name: values.name,
        services: values.services.map(service => ({
          name: service.name,
          image: service.image,
          // Ensure all environment variables have required name and value properties
          environmentVariables: service.environmentVariables.map(envVar => ({
            name: envVar.name,
            value: envVar.value
          }))
        })),
      });
      
      toast({
        title: "Sandbox updated",
        description: "The sandbox has been updated successfully.",
      });
      
      onSandboxUpdated();
    } catch (error) {
      console.error('Error updating sandbox:', error);
      toast({
        title: "Error",
        description: "Failed to update the sandbox.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{sandbox.name}</h2>
          <p className="text-sm text-muted-foreground">ID: {sandbox.id}</p>
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sandbox Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Services</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addService}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>

            <div className="space-y-4">
              {form.watch('services').map((service, serviceIndex) => (
                <Card key={serviceIndex}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-md">Service {serviceIndex + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeService(serviceIndex)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>Configure service details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`services.${serviceIndex}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`services.${serviceIndex}.image`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Docker Image</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., nginx:latest" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Environment Variables</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addEnvVar(serviceIndex)}
                          className="flex items-center"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Variable
                        </Button>
                      </div>

                      {service.environmentVariables?.map((envVar, envVarIndex) => (
                        <div key={envVarIndex} className="grid grid-cols-5 gap-2 mb-2">
                          <FormField
                            control={form.control}
                            name={`services.${serviceIndex}.environmentVariables.${envVarIndex}.name`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormControl>
                                  <Input {...field} placeholder="Name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`services.${serviceIndex}.environmentVariables.${envVarIndex}.value`}
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormControl>
                                  <Input {...field} placeholder="Value" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEnvVar(serviceIndex, envVarIndex)}
                            className="h-10 w-10 p-0 flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full flex items-center justify-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SandboxDetails;
