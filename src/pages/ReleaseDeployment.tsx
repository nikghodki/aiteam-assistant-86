
import React, { useState, useRef, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  TerminalSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpCircle,
  Calendar,
  Package
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ReleaseEvent {
  id: string;
  releaseId: string;
  type: 'deployment' | 'rollback' | 'validation' | 'approval';
  status: 'success' | 'failure' | 'in-progress' | 'pending';
  description: string;
  timestamp: Date;
}

interface Release {
  id: string;
  name: string;
  version: string;
  status: 'planned' | 'in-progress' | 'deployed' | 'failed' | 'rolled-back';
  environment: 'dev' | 'staging' | 'production';
  scheduledDate: Date | null;
  deployedDate: Date | null;
  events: ReleaseEvent[];
}

const mockReleases: Release[] = [
  {
    id: '1',
    name: 'API Service Update',
    version: 'v1.2.0',
    status: 'deployed',
    environment: 'staging',
    scheduledDate: new Date('2023-06-15'),
    deployedDate: new Date('2023-06-15'),
    events: [
      {
        id: '101',
        releaseId: '1',
        type: 'deployment',
        status: 'success',
        description: 'Deployment initiated to staging',
        timestamp: new Date('2023-06-15T09:00:00')
      },
      {
        id: '102',
        releaseId: '1',
        type: 'validation',
        status: 'success',
        description: 'Automated tests passed',
        timestamp: new Date('2023-06-15T09:15:00')
      }
    ]
  },
  {
    id: '2',
    name: 'Frontend Updates',
    version: 'v2.0.1',
    status: 'in-progress',
    environment: 'production',
    scheduledDate: new Date('2023-06-20'),
    deployedDate: null,
    events: [
      {
        id: '201',
        releaseId: '2',
        type: 'approval',
        status: 'success',
        description: 'Release approved by team lead',
        timestamp: new Date('2023-06-19T14:00:00')
      },
      {
        id: '202',
        releaseId: '2',
        type: 'deployment',
        status: 'in-progress',
        description: 'Deployment to production started',
        timestamp: new Date('2023-06-20T10:00:00')
      }
    ]
  },
  {
    id: '3',
    name: 'Infrastructure Update',
    version: 'v1.1.0',
    status: 'failed',
    environment: 'production',
    scheduledDate: new Date('2023-06-18'),
    deployedDate: new Date('2023-06-18'),
    events: [
      {
        id: '301',
        releaseId: '3',
        type: 'deployment',
        status: 'failure',
        description: 'Database migration failed',
        timestamp: new Date('2023-06-18T08:30:00')
      },
      {
        id: '302',
        releaseId: '3',
        type: 'rollback',
        status: 'success',
        description: 'Rolled back to previous version',
        timestamp: new Date('2023-06-18T09:00:00')
      }
    ]
  }
];

const ReleaseDeployment = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I can help you with release deployment management. How can I assist you today?',
      sender: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [releases, setReleases] = useState<Release[]>(mockReleases);
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
    
    // Process message to check for commands
    const inputLower = input.toLowerCase();
    
    // Simulate intelligent responses based on input
    setTimeout(() => {
      let responseContent = '';
      
      if (inputLower.includes('deploy') && inputLower.includes('production')) {
        responseContent = "I can help you deploy to production. Please confirm which release you want to deploy, and I'll initiate the process.";
        
        // If there's a release in staging, suggest it
        const stagingReleases = releases.filter(r => r.environment === 'staging' && r.status === 'deployed');
        if (stagingReleases.length > 0) {
          responseContent += ` I see that "${stagingReleases[0].name} (${stagingReleases[0].version})" is ready in staging. Would you like to promote this to production?`;
        }
      } 
      else if (inputLower.includes('status') || inputLower.includes('overview')) {
        const inProgressCount = releases.filter(r => r.status === 'in-progress').length;
        const deployedCount = releases.filter(r => r.status === 'deployed').length;
        const failedCount = releases.filter(r => r.status === 'failed').length;
        
        responseContent = `Current release status: ${inProgressCount} in progress, ${deployedCount} deployed successfully, ${failedCount} failed. Please check the releases table for more details.`;
      }
      else if (inputLower.includes('rollback') || inputLower.includes('revert')) {
        responseContent = "I understand you want to perform a rollback. Please specify which release you want to roll back, and I'll prepare the rollback plan for your approval.";
      }
      else if (inputLower.includes('schedule') || inputLower.includes('plan')) {
        responseContent = "I can help you schedule a new release. Please provide the release name, version, target environment, and preferred deployment date.";
      }
      else {
        responseContent = `I'll help you with "${input}". Could you provide more specific details about what you'd like to accomplish with this release deployment?`;
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000);
  };

  const getStatusIcon = (status: Release['status']) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress':
        return <Clock size={16} className="text-blue-500" />;
      case 'failed':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'rolled-back':
        return <ArrowUpCircle size={16} className="text-amber-500" />;
      case 'planned':
        return <Calendar size={16} className="text-gray-500" />;
      default:
        return <Package size={16} />;
    }
  };

  const getEventIcon = (type: ReleaseEvent['type'], status: ReleaseEvent['status']) => {
    if (status === 'failure') return <AlertTriangle size={16} className="text-red-500" />;
    if (status === 'in-progress') return <Clock size={16} className="text-blue-500" />;
    if (status === 'pending') return <Calendar size={16} className="text-gray-500" />;
    
    switch (type) {
      case 'deployment':
        return <TerminalSquare size={16} className="text-green-500" />;
      case 'rollback':
        return <ArrowUpCircle size={16} className="text-amber-500" />;
      case 'validation':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'approval':
        return <CheckCircle size={16} className="text-blue-500" />;
      default:
        return <Package size={16} />;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Release Deployment Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chat Interface */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Deployment Assistant</CardTitle>
              <CardDescription>
                Chat with the AI to manage and deploy releases
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
          
          {/* Releases Table */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Recent Releases</CardTitle>
              <CardDescription>
                Overview of recent and upcoming deployments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releases.map((release) => (
                      <TableRow 
                        key={release.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          // When a release is clicked, show its details in a toast
                          toast({
                            title: `${release.name} (${release.version})`,
                            description: (
                              <div className="mt-2 space-y-2">
                                <p>Status: {release.status} | Environment: {release.environment}</p>
                                <div className="border-t pt-2">
                                  <p className="font-medium mb-1">Recent Events:</p>
                                  <ul className="space-y-1">
                                    {release.events.slice(0, 3).map(event => (
                                      <li key={event.id} className="flex items-start gap-2">
                                        {getEventIcon(event.type, event.status)}
                                        <span className="text-sm">{event.description}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ),
                          });
                        }}
                      >
                        <TableCell className="font-medium">{release.name}</TableCell>
                        <TableCell>{release.version}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(release.status)}
                            <span>{release.status}</span>
                          </div>
                        </TableCell>
                        <TableCell>{release.environment}</TableCell>
                        <TableCell className="text-right">
                          {(release.deployedDate || release.scheduledDate)?.toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Refreshing release data",
                    description: "Getting the latest deployment information..."
                  });
                  
                  // Simulate refresh
                  setTimeout(() => {
                    toast({
                      title: "Release data refreshed",
                      description: "The release information has been updated."
                    });
                  }, 1000);
                }}
              >
                Refresh Data
              </Button>
              <Button
                onClick={() => {
                  // Simulate scheduling a new release
                  toast({
                    title: "Schedule New Release",
                    description: "This would open a form to schedule a new release."
                  });
                }}
              >
                Schedule Release
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ReleaseDeployment;
