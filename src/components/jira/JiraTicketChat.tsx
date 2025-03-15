
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, XCircle, Ticket, ChevronDown } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { jiraApi, ChatResponse, JiraTicket as JiraTicketType, JiraProject, JiraIssueType } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTicketCreation?: boolean;
  ticketInfo?: {
    key: string;
    url: string;
  };
}

interface JiraTicketInfo {
  key: string;
  url: string;
  summary: string;
  description: string;
  priority: string;
  status: string;
  project?: string;
  issueType?: string;
}

interface JiraTicketChatProps {
  onTicketCreated?: (ticket: JiraTicketInfo) => void;
}

// Helper function to format message content
const formatMessageContent = (content: string) => {
  // Format numbered lists (e.g., 1. Item, 2. Item)
  content = content.replace(/(\d+)\.\s(.*?)(?=\n\d+\.|\n\n|$)/gs, '<li>$1. $2</li>');
  if (content.includes('<li>')) {
    content = '<ol>' + content + '</ol>';
    // Clean up any newlines between list items
    content = content.replace(/<\/li>\n+<li>/g, '</li><li>');
  }
  
  // Format code/commands (text between backticks)
  content = content.replace(/`([^`]+)`/g, '<code class="bg-muted p-1 rounded text-xs font-mono">$1</code>');
  
  // Format links
  content = content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Convert newlines to <br>
  content = content.replace(/\n/g, '<br>');
  
  return content;
};

const JiraTicketChat = ({ onTicketCreated }: JiraTicketChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ticketFormVisible, setTicketFormVisible] = useState(false);
  const [ticketSummary, setTicketSummary] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('Medium');
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isLoadingIssueTypes, setIsLoadingIssueTypes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add a welcome message when component mounts
  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm your Jira ticket assistant. How can I help you create a ticket today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
    
    // Fetch projects when component mounts
    fetchProjects();
  }, []);
  
  // Fetch Jira projects
  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const projectsData = await jiraApi.getProjects();
      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].key);
        // Fetch issue types for the first project
        fetchIssueTypes(projectsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Add fallback mock projects
      const mockProjects: JiraProject[] = [
        { id: 'DEMO-1', key: 'DEMO', name: 'Demo Project' },
        { id: 'ENG-1', key: 'ENG', name: 'Engineering' },
        { id: 'OPS-1', key: 'OPS', name: 'Operations' }
      ];
      setProjects(mockProjects);
      setSelectedProject('DEMO');
      
      // Also set mock issue types
      const mockIssueTypes: JiraIssueType[] = [
        { id: 'BUG-1', name: 'Bug' },
        { id: 'TASK-1', name: 'Task' },
        { id: 'STORY-1', name: 'Story' }
      ];
      setIssueTypes(mockIssueTypes);
      setSelectedIssueType('Bug');
    } finally {
      setIsLoadingProjects(false);
    }
  };
  
  // Fetch issue types for a project
  const fetchIssueTypes = async (projectId: string) => {
    setIsLoadingIssueTypes(true);
    try {
      const issueTypesData = await jiraApi.getIssueTypes(projectId);
      setIssueTypes(issueTypesData);
      
      if (issueTypesData.length > 0) {
        setSelectedIssueType(issueTypesData[0].name);
      }
    } catch (error) {
      console.error('Error fetching issue types:', error);
      
      // Add fallback mock issue types
      const mockIssueTypes: JiraIssueType[] = [
        { id: 'BUG-1', name: 'Bug' },
        { id: 'TASK-1', name: 'Task' },
        { id: 'STORY-1', name: 'Story' }
      ];
      setIssueTypes(mockIssueTypes);
      setSelectedIssueType('Bug');
    } finally {
      setIsLoadingIssueTypes(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Use the Jira API chat assistant
      const response = await jiraApi.chatWithAssistant(inputMessage);
      
      // Check if the message is about creating a ticket
      const isTicketRequest = /create\s+ticket|new\s+ticket|make\s+ticket|submit\s+ticket|create\s+issue|add\s+issue/i.test(inputMessage);
      
      if (isTicketRequest) {
        // Generate suggested title and description based on the user's message
        const suggestedSummary = inputMessage.length > 50 
          ? inputMessage.substring(0, 50) + '...' 
          : inputMessage;
        
        setTicketSummary(suggestedSummary);
        setTicketDescription(inputMessage);
        setTicketFormVisible(true);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.response || "I can help you create a Jira ticket. Please fill out the form that appears below, or continue providing more details about your issue.",
          sender: 'assistant',
          timestamp: new Date(),
          isTicketCreation: true
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        // General response from the API
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.response,
          sender: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get a response from the assistant.",
      });
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProjectChange = (projectKey: string) => {
    setSelectedProject(projectKey);
    
    // Find project by key and fetch issue types
    const project = projects.find(p => p.key === projectKey);
    if (project) {
      fetchIssueTypes(project.id);
    }
  };
  
  const handleCreateTicket = async () => {
    if (!ticketSummary.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ticket summary.",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a real Jira ticket using the enhanced API
      const ticketResponse = await jiraApi.createTicket({
        summary: ticketSummary,
        description: ticketDescription,
        priority: ticketPriority,
        project: selectedProject,
        issueType: selectedIssueType
      });
      
      // Create a ticket info object to pass to the parent component
      const ticket: JiraTicketInfo = {
        key: ticketResponse.key,
        url: ticketResponse.url,
        summary: ticketSummary,
        description: ticketDescription,
        priority: ticketPriority,
        status: 'Open',
        project: selectedProject,
        issueType: selectedIssueType
      };
      
      // Add confirmation message
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `Ticket created successfully! You can track it with ID: ${ticket.key}`,
        sender: 'assistant',
        timestamp: new Date(),
        isTicketCreation: true,
        ticketInfo: {
          key: ticket.key,
          url: ticket.url
        }
      };
      
      setMessages(prev => [...prev, confirmationMessage]);
      
      // Reset form
      setTicketFormVisible(false);
      setTicketSummary('');
      setTicketDescription('');
      setTicketPriority('Medium');
      
      // Notify parent component
      if (onTicketCreated) {
        onTicketCreated(ticket);
      }
      
      toast({
        title: "Success",
        description: `Jira ticket ${ticket.key} created successfully.`,
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create Jira ticket.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const cancelTicketCreation = () => {
    setTicketFormVisible(false);
    setTicketSummary('');
    setTicketDescription('');
    setTicketPriority('Medium');
  };
  
  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm your Jira ticket assistant. How can I help you create a ticket today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
    setTicketFormVisible(false);
    setTicketSummary('');
    setTicketDescription('');
    setTicketPriority('Medium');
  };

  return (
    <div className="flex flex-col h-[600px] max-h-[600px] border border-border/30 rounded-lg shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/20 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={18} className="text-primary" />
          <h3 className="font-medium text-sm">Jira Ticket Assistant</h3>
        </div>
        <button 
          onClick={clearChat}
          className="p-1 rounded-full hover:bg-muted-foreground/10"
          title="Clear chat"
        >
          <XCircle size={16} />
        </button>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 p-3 overflow-y-auto bg-background/50">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={cn(
                "flex items-start space-x-2 max-w-[90%]",
                message.sender === 'user' ? "ml-auto" : ""
              )}
            >
              {message.sender === 'assistant' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  <Bot size={14} className="text-primary" />
                </div>
              )}
              
              <div className={cn(
                "p-3 rounded-lg text-sm shadow-sm",
                message.sender === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted rounded-tl-none border border-border/20"
              )}>
                {message.sender === 'assistant' ? (
                  <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                ) : (
                  message.content
                )}
                
                {message.ticketInfo && (
                  <div className="mt-2 p-2 bg-background/50 rounded border border-border/40">
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Ticket size={12} className="mr-1" />
                      <a 
                        href={message.ticketInfo.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {message.ticketInfo.key}
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {message.sender === 'user' && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex items-start space-x-2 max-w-[90%]">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <Bot size={14} className="text-primary" />
              </div>
              <div className="p-3 rounded-lg text-sm bg-muted rounded-tl-none border border-border/20 shadow-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce delay-200"></div>
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full animate-bounce delay-300"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Enhanced ticket creation form */}
      {ticketFormVisible && (
        <div className="p-3 border-t border-border/30 bg-muted/20">
          <div className="space-y-3">
            <div>
              <label htmlFor="ticket-summary" className="text-xs font-medium block mb-1">Ticket Summary</label>
              <Input
                id="ticket-summary"
                value={ticketSummary}
                onChange={(e) => setTicketSummary(e.target.value)}
                placeholder="Brief summary of the issue"
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ticket-project" className="text-xs font-medium block mb-1">Project</label>
                <Select
                  value={selectedProject}
                  onValueChange={handleProjectChange}
                  disabled={isLoading || isLoadingProjects}
                >
                  <SelectTrigger className="w-full text-left">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {isLoadingProjects ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-xs">Loading...</span>
                      </div>
                    ) : (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.key}>
                          {project.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="ticket-type" className="text-xs font-medium block mb-1">Issue Type</label>
                <Select
                  value={selectedIssueType}
                  onValueChange={setSelectedIssueType}
                  disabled={isLoading || isLoadingIssueTypes}
                >
                  <SelectTrigger className="w-full text-left">
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {isLoadingIssueTypes ? (
                      <div className="flex items-center justify-center py-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-xs">Loading...</span>
                      </div>
                    ) : (
                      issueTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label htmlFor="ticket-priority" className="text-xs font-medium block mb-1">Priority</label>
              <Select
                value={ticketPriority}
                onValueChange={setTicketPriority}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full text-left">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="ticket-description" className="text-xs font-medium block mb-1">Description</label>
              <Textarea
                id="ticket-description"
                value={ticketDescription}
                onChange={(e) => setTicketDescription(e.target.value)}
                placeholder="Detailed description of the issue"
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelTicketCreation}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateTicket}
                disabled={isLoading || !ticketSummary.trim()}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={14} className="mr-1 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Ticket size={14} className="mr-1" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat input */}
      <form 
        onSubmit={handleSendMessage} 
        className="border-t p-3 flex items-end space-x-2 bg-card/50"
      >
        <Textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Describe your issue or ask for help..."
          className="min-h-[60px] resize-none"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !inputMessage.trim()}
          className="h-[60px]"
        >
          {isLoading ? (
            <RefreshCw size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </Button>
      </form>
    </div>
  );
};

export default JiraTicketChat;
