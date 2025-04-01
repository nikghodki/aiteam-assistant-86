
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { ChatResponse, sandboxApi } from '@/services/sandboxApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useForm } from "react-hook-form";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SandboxChatProps {
  onSandboxChange?: () => void;
  selectedSandboxId?: string;
  onSandboxCreationStarted?: (sandboxId: string) => void;
}

interface SandboxCreationForm {
  base_image_path: string;
  base_image_tag: string;
  product_name: string;
  custom_service_name: string;
  custom_image_path: string;
  custom_image_tag: string;
}

// Function to format code blocks in the message
const formatMessage = (message: string): JSX.Element => {
  const parts = message.split(/(```[\s\S]*?```)/g);
  
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const code = part.slice(3, -3);
          return (
            <pre key={i} className="bg-muted p-2 rounded-md my-2 overflow-x-auto">
              <code>{code}</code>
            </pre>
          );
        } else {
          return <span key={i}>{part}</span>;
        }
      })}
    </>
  );
};

const SandboxChat: React.FC<SandboxChatProps> = ({ 
  onSandboxChange, 
  selectedSandboxId,
  onSandboxCreationStarted 
}) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your sandbox orchestration assistant. How can I help you today? You can ask me to create a new sandbox, update an existing one, or help you manage your current sandboxes.',
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [showCreationForm, setShowCreationForm] = useState(false);

  const form = useForm<SandboxCreationForm>({
    defaultValues: {
      base_image_path: 'docker.io/library/ubuntu',
      base_image_tag: 'latest',
      product_name: '',
      custom_service_name: '',
      custom_image_path: 'docker.io/custom',
      custom_image_tag: 'latest'
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Maintain scroll position when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    
    // Check if the message is about creating a sandbox
    const createSandboxRegex = /create|new|start|launch|build|make|spin up/i;
    const sandboxRegex = /sandbox|environment|env|container/i;
    
    if (createSandboxRegex.test(e.target.value) && sandboxRegex.test(e.target.value)) {
      setShowCreationForm(true);
    }
  };

  const handleSandboxFormSubmit = async (data: SandboxCreationForm) => {
    // Add a user message showing the form submission
    const formSummary = `
Creating sandbox with:
- Base image: ${data.base_image_path}:${data.base_image_tag}
- Product: ${data.product_name}
- Service: ${data.custom_service_name}
- Custom image: ${data.custom_image_path}:${data.custom_image_tag}
`;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: formSummary,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setShowCreationForm(false);
    
    try {
      // Use our simulation function for demo mode
      const chatResponse: ChatResponse = await sandboxApi.simulateSandboxCreation(formSummary);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If the assistant took an action that should refresh the sandbox list
      if (chatResponse.actionTaken) {
        if (onSandboxChange) {
          onSandboxChange();
        }
        
        // Show a toast notification if an action was taken
        toast({
          title: 'Sandbox Creation Started',
          description: `The sandbox "${chatResponse.sandbox?.name}" has been initiated successfully.`,
        });

        // Notify parent to show workflow
        if (onSandboxCreationStarted && chatResponse.sandbox) {
          onSandboxCreationStarted(chatResponse.sandbox.id);
        }
      }
    } catch (error) {
      console.error('Error creating sandbox:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sandbox',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Check if this is a demo request for creating a sandbox
      // Make demo mode easier to trigger - look for "demo" anywhere in the message
      const isDemo = inputMessage.toLowerCase().includes('demo');
      const containsCreateKeywords = /create|new|start|launch|build|make|spin up/i.test(inputMessage);
      
      if (isDemo || demoMode) {
        setDemoMode(true);
        
        // Only proceed with sandbox creation if there are creation keywords
        if (containsCreateKeywords) {
          // Use our simulation function instead of the real API
          const chatResponse: ChatResponse = await sandboxApi.simulateSandboxCreation(inputMessage);
          
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: chatResponse.response,
            timestamp: new Date(),
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          
          // If the assistant took an action that should refresh the sandbox list
          if (chatResponse.actionTaken) {
            if (onSandboxChange) {
              onSandboxChange();
            }
            
            // Show a toast notification if an action was taken
            toast({
              title: chatResponse.actionTaken === 'create' 
                ? 'Sandbox Creation Started' 
                : chatResponse.actionTaken === 'update' 
                ? 'Sandbox Updated' 
                : 'Sandbox Deleted',
              description: chatResponse.actionTaken === 'delete' 
                ? 'The sandbox has been deleted successfully.' 
                : `The sandbox "${chatResponse.sandbox?.name}" has been ${chatResponse.actionTaken === 'create' ? 'initiated' : 'updated'} successfully.`,
            });

            // If this is a create action, notify parent to show workflow
            if (chatResponse.actionTaken === 'create' && onSandboxCreationStarted && chatResponse.sandbox) {
              onSandboxCreationStarted(chatResponse.sandbox.id);
            }
          }
        } else {
          // If it's demo mode but not a create request
          const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: "I'm in demo mode. Try asking me to 'create a new sandbox for testing' to see the workflow in action!",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, assistantMessage]);
        }
      } else {
        // Get the response from the sandbox assistant
        const chatResponse: ChatResponse = await sandboxApi.chatWithAssistant(inputMessage, selectedSandboxId);
        
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: chatResponse.response,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // If the assistant took an action that should refresh the sandbox list
        if (chatResponse.actionTaken) {
          if (onSandboxChange) {
            onSandboxChange();
          }
          
          // Show a toast notification if an action was taken
          toast({
            title: chatResponse.actionTaken === 'create' 
              ? 'Sandbox Creation Started' 
              : chatResponse.actionTaken === 'update' 
              ? 'Sandbox Updated' 
              : 'Sandbox Deleted',
            description: chatResponse.actionTaken === 'delete' 
              ? 'The sandbox has been deleted successfully.' 
              : `The sandbox "${chatResponse.sandbox?.name}" has been ${chatResponse.actionTaken === 'create' ? 'initiated' : 'updated'} successfully.`,
          });

          // If this is a create action, notify parent to show workflow
          if (chatResponse.actionTaken === 'create' && onSandboxCreationStarted && chatResponse.sandbox) {
            onSandboxCreationStarted(chatResponse.sandbox.id);
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from the sandbox assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={cn("p-3 rounded-lg max-w-[75%] shadow-sm",
              message.role === 'user' 
                ? "bg-gray-100 dark:bg-gray-700 text-right" 
                : "bg-professional-purple-light/10 dark:bg-professional-purple-dark/10"
            )}>
              <div className="text-sm">
                {message.role === 'user' ? (
                  <p className="font-semibold text-professional-purple dark:text-professional-purple-light mb-1">You</p>
                ) : (
                  <p className="font-semibold text-professional-purple mb-1">Sandbox Assistant</p>
                )}
                <p className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</p>
                <p className="text-xs text-muted-foreground mt-1 text-right">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {showCreationForm && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-muted/20 animate-in slide-in-from-bottom-5">
          <h3 className="text-sm font-medium mb-2">Sandbox Creation Details</h3>
          <form onSubmit={form.handleSubmit(handleSandboxFormSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="base_image_path">Base Image Path</Label>
                <Input
                  id="base_image_path"
                  {...form.register("base_image_path")}
                />
              </div>
              <div>
                <Label htmlFor="base_image_tag">Base Image Tag</Label>
                <Input
                  id="base_image_tag"
                  {...form.register("base_image_tag")}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="product_name">Product Name</Label>
              <Input
                id="product_name"
                placeholder="e.g. platform, api, frontend"
                {...form.register("product_name")}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="custom_service_name">Custom Service Name</Label>
              <Input
                id="custom_service_name"
                placeholder="e.g. auth-service, data-api"
                {...form.register("custom_service_name")}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="custom_image_path">Custom Image Path</Label>
                <Input
                  id="custom_image_path"
                  {...form.register("custom_image_path")}
                />
              </div>
              <div>
                <Label htmlFor="custom_image_tag">Custom Image Tag</Label>
                <Input
                  id="custom_image_tag"
                  {...form.register("custom_image_tag")}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreationForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Sandbox</Button>
            </div>
          </form>
        </div>
      )}
      
      <div className="p-4 border-t dark:border-gray-700">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} className="relative">
          <Textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={demoMode ? "Try: 'create a new sandbox for testing'" : "Ask me to create or manage sandboxes..."}
            className="w-full pr-10 resize-none focus:ring-0 focus-visible:ring-0 dark:bg-gray-700"
            rows={3}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="absolute right-2 bottom-2 bg-professional-purple-DEFAULT hover:bg-professional-purple-dark text-white rounded-md p-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || !inputMessage.trim()}
            aria-label="Send message"
          >
            {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SandboxChat;
