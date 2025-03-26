
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreHorizontal, Send, Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from '@/components/ui/use-toast';

interface Sandbox {
  id: string;
  name: string;
  status: 'stable' | 'unstable' | 'creating' | 'updating';
  services: {
    name: string;
    imageTag: string;
  }[];
  envVariables: {
    key: string;
    value: string;
  }[];
  createdAt: Date;
}

const mockSandboxes: Sandbox[] = [
  {
    id: '1',
    name: 'dev-sandbox-1',
    status: 'stable',
    services: [
      { name: 'api-service', imageTag: 'v1.0.2' },
      { name: 'frontend-service', imageTag: 'v1.1.0' }
    ],
    envVariables: [
      { key: 'API_URL', value: 'http://localhost:8000' },
      { key: 'DEBUG', value: 'true' }
    ],
    createdAt: new Date('2023-05-15')
  },
  {
    id: '2',
    name: 'test-sandbox',
    status: 'unstable',
    services: [
      { name: 'api-service', imageTag: 'v1.1.0-rc' },
      { name: 'frontend-service', imageTag: 'v1.2.0-beta' }
    ],
    envVariables: [
      { key: 'API_URL', value: 'http://test-api:8000' },
      { key: 'DEBUG', value: 'true' }
    ],
    createdAt: new Date('2023-05-20')
  },
  {
    id: '3',
    name: 'staging-sandbox',
    status: 'creating',
    services: [
      { name: 'api-service', imageTag: 'v1.1.0' },
      { name: 'frontend-service', imageTag: 'v1.2.0' }
    ],
    envVariables: [
      { key: 'API_URL', value: 'http://staging-api:8000' },
      { key: 'DEBUG', value: 'false' }
    ],
    createdAt: new Date('2023-06-01')
  }
];

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

const SandboxOrchestration = () => {
  const [sandboxes, setSandboxes] = useState<Sandbox[]>(mockSandboxes);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I can help you create, manage, and update sandboxes. What would you like to do?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedSandbox, setSelectedSandbox] = useState<Sandbox | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    
    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I'll help you with "${input}". What specific details would you like to configure?`,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const handleCreateSandbox = () => {
    const newSandbox: Sandbox = {
      id: (sandboxes.length + 1).toString(),
      name: `new-sandbox-${sandboxes.length + 1}`,
      status: 'creating',
      services: [{ name: 'default-service', imageTag: 'latest' }],
      envVariables: [],
      createdAt: new Date()
    };
    
    setSandboxes(prev => [...prev, newSandbox]);
    setSelectedSandbox(newSandbox);
    
    toast({
      title: "Creating sandbox",
      description: `${newSandbox.name} is being created...`,
    });
    
    // Simulate sandbox creation
    setTimeout(() => {
      setSandboxes(prev => 
        prev.map(sb => 
          sb.id === newSandbox.id ? { ...sb, status: 'stable' } : sb
        )
      );
      
      toast({
        title: "Sandbox created",
        description: `${newSandbox.name} is now stable and ready to use.`,
      });
    }, 3000);
  };

  const handleDeleteSandbox = (id: string) => {
    const sandboxToDelete = sandboxes.find(sb => sb.id === id);
    
    if (sandboxToDelete) {
      toast({
        title: "Deleting sandbox",
        description: `${sandboxToDelete.name} is being deleted...`,
      });
      
      // If the deleted sandbox was selected, clear selection
      if (selectedSandbox?.id === id) {
        setSelectedSandbox(null);
      }
      
      setSandboxes(prev => prev.filter(sb => sb.id !== id));
    }
  };

  const handleRefreshSandbox = (id: string) => {
    const sandboxToRefresh = sandboxes.find(sb => sb.id === id);
    
    if (sandboxToRefresh) {
      toast({
        title: "Refreshing sandbox",
        description: `${sandboxToRefresh.name} is being refreshed...`,
      });
      
      // Update sandbox status to updating
      setSandboxes(prev => 
        prev.map(sb => 
          sb.id === id ? { ...sb, status: 'updating' } : sb
        )
      );
      
      // Simulate refresh
      setTimeout(() => {
        setSandboxes(prev => 
          prev.map(sb => 
            sb.id === id ? { ...sb, status: 'stable' } : sb
          )
        );
        
        toast({
          title: "Sandbox refreshed",
          description: `${sandboxToRefresh.name} is now stable again.`,
        });
      }, 2000);
    }
  };

  const getStatusBadgeColor = (status: Sandbox['status']) => {
    switch (status) {
      case 'stable':
        return 'bg-green-500';
      case 'unstable':
        return 'bg-red-500';
      case 'creating':
        return 'bg-blue-500';
      case 'updating':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Sandbox Orchestration</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sandboxes List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Your Sandboxes</CardTitle>
                  <Button onClick={handleCreateSandbox} size="sm" className="h-8 gap-1">
                    <Plus size={16} />
                    <span className="hidden sm:inline">New Sandbox</span>
                  </Button>
                </div>
                <CardDescription>
                  Manage your development environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {sandboxes.map(sandbox => (
                      <div 
                        key={sandbox.id}
                        className={`p-3 border rounded-md hover:bg-muted/50 transition-colors cursor-pointer ${selectedSandbox?.id === sandbox.id ? 'border-professional-purple bg-professional-purple/5' : 'border-border'}`}
                        onClick={() => setSelectedSandbox(sandbox)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{sandbox.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className={`${getStatusBadgeColor(sandbox.status)} text-white`}>
                                {sandbox.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {sandbox.services.length} services
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {sandbox.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedSandbox(sandbox)}>
                                <Edit size={14} className="mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRefreshSandbox(sandbox.id)}>
                                <RefreshCw size={14} className="mr-2" />
                                Refresh
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSandbox(sandbox.id);
                                }}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 size={14} className="mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Chat or Sandbox Details */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="chat" className="h-full">
              <TabsList className="mb-4">
                <TabsTrigger value="chat">AI Assistant</TabsTrigger>
                <TabsTrigger value="details">Sandbox Details</TabsTrigger>
              </TabsList>
              
              {/* Chat Interface */}
              <TabsContent value="chat" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Chat with AI Assistant</CardTitle>
                    <CardDescription>
                      Use natural language to create, manage and update your sandboxes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-0">
                    <div className="h-[calc(100vh-360px)] flex flex-col">
                      <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                          {messages.map(message => (
                            <div 
                              key={message.id} 
                              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div 
                                className={`rounded-lg p-3 max-w-[80%] ${
                                  message.sender === 'user' 
                                    ? 'bg-professional-purple text-white' 
                                    : 'bg-muted'
                                }`}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4">
                    <form 
                      className="w-full flex items-center gap-2" 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage();
                      }}
                    >
                      <Textarea 
                        placeholder="Type a message..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="min-h-[60px] flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                      <Button type="submit" size="icon" className="h-[60px] w-[60px]">
                        <Send size={20} />
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              {/* Sandbox Details */}
              <TabsContent value="details" className="h-full">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>
                      {selectedSandbox ? selectedSandbox.name : 'Sandbox Details'}
                    </CardTitle>
                    <CardDescription>
                      {selectedSandbox 
                        ? `Status: ${selectedSandbox.status} | Created: ${selectedSandbox.createdAt.toLocaleDateString()}`
                        : 'Select a sandbox to view details'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedSandbox ? (
                      <div className="space-y-6">
                        {/* Basic Details */}
                        <div>
                          <h3 className="text-lg font-medium mb-3">Basic Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <Input 
                                value={selectedSandbox.name} 
                                onChange={(e) => setSelectedSandbox({
                                  ...selectedSandbox,
                                  name: e.target.value
                                })}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Status</label>
                              <div className="mt-2">
                                <Badge variant="outline" className={`${getStatusBadgeColor(selectedSandbox.status)} text-white`}>
                                  {selectedSandbox.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Services */}
                        <div>
                          <h3 className="text-lg font-medium mb-3">Services</h3>
                          <div className="space-y-2">
                            {selectedSandbox.services.map((service, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md">
                                <div>
                                  <label className="text-sm font-medium">Service Name</label>
                                  <Input 
                                    value={service.name} 
                                    onChange={(e) => {
                                      const updatedServices = [...selectedSandbox.services];
                                      updatedServices[index].name = e.target.value;
                                      setSelectedSandbox({
                                        ...selectedSandbox,
                                        services: updatedServices
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Image Tag</label>
                                  <Input 
                                    value={service.imageTag} 
                                    onChange={(e) => {
                                      const updatedServices = [...selectedSandbox.services];
                                      updatedServices[index].imageTag = e.target.value;
                                      setSelectedSandbox({
                                        ...selectedSandbox,
                                        services: updatedServices
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => setSelectedSandbox({
                                ...selectedSandbox,
                                services: [
                                  ...selectedSandbox.services,
                                  { name: '', imageTag: 'latest' }
                                ]
                              })}
                            >
                              <Plus size={16} className="mr-2" />
                              Add Service
                            </Button>
                          </div>
                        </div>
                        
                        {/* Environment Variables */}
                        <div>
                          <h3 className="text-lg font-medium mb-3">Environment Variables</h3>
                          <div className="space-y-2">
                            {selectedSandbox.envVariables.map((envVar, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-md">
                                <div>
                                  <label className="text-sm font-medium">Key</label>
                                  <Input 
                                    value={envVar.key} 
                                    onChange={(e) => {
                                      const updatedEnvVars = [...selectedSandbox.envVariables];
                                      updatedEnvVars[index].key = e.target.value;
                                      setSelectedSandbox({
                                        ...selectedSandbox,
                                        envVariables: updatedEnvVars
                                      });
                                    }}
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Value</label>
                                  <Input 
                                    value={envVar.value} 
                                    onChange={(e) => {
                                      const updatedEnvVars = [...selectedSandbox.envVariables];
                                      updatedEnvVars[index].value = e.target.value;
                                      setSelectedSandbox({
                                        ...selectedSandbox,
                                        envVariables: updatedEnvVars
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                            <Button 
                              variant="outline" 
                              className="w-full mt-2"
                              onClick={() => setSelectedSandbox({
                                ...selectedSandbox,
                                envVariables: [
                                  ...selectedSandbox.envVariables,
                                  { key: '', value: '' }
                                ]
                              })}
                            >
                              <Plus size={16} className="mr-2" />
                              Add Environment Variable
                            </Button>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline"
                            onClick={() => handleRefreshSandbox(selectedSandbox.id)}
                          >
                            <RefreshCw size={16} className="mr-2" />
                            Refresh
                          </Button>
                          <Button 
                            variant="default"
                            onClick={() => {
                              // Update sandbox in the list
                              setSandboxes(prev =>
                                prev.map(sb =>
                                  sb.id === selectedSandbox.id ? selectedSandbox : sb
                                )
                              );
                              
                              toast({
                                title: "Sandbox updated",
                                description: `${selectedSandbox.name} has been updated.`,
                              });
                            }}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[calc(100vh-300px)]">
                        <p className="text-muted-foreground">Select a sandbox from the list to view details</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={handleCreateSandbox}
                        >
                          <Plus size={16} className="mr-2" />
                          Create New Sandbox
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SandboxOrchestration;
