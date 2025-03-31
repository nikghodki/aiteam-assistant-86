
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ChatResponse, releaseApi } from '@/services/releaseApi';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ReleaseChatProps {
  onReleaseChange?: () => void;
  selectedReleaseId?: string;
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

const ReleaseChat: React.FC<ReleaseChatProps> = ({ onReleaseChange, selectedReleaseId }) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your release deployment assistant. I can help you create new releases, deploy them to different environments, or assist with rollbacks if needed. How can I help you today?',
    timestamp: new Date(),
  }]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Get the response from the release assistant
      const chatResponse: ChatResponse = await releaseApi.chatWithAssistant(inputMessage, selectedReleaseId);
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: chatResponse.response,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If the assistant took an action that should refresh the release list
      if (chatResponse.actionTaken) {
        if (onReleaseChange) {
          onReleaseChange();
        }
        
        // Show a toast notification if an action was taken
        toast({
          title: chatResponse.actionTaken === 'create' 
            ? 'Release Created' 
            : chatResponse.actionTaken === 'deploy' 
            ? 'Deployment Initiated' 
            : 'Rollback Initiated',
          description: chatResponse.actionTaken === 'create'
            ? `The release "${chatResponse.release?.name}" has been created successfully.`
            : `The ${chatResponse.actionTaken} action has been initiated successfully for release "${chatResponse.release?.name}".`,
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from the release assistant',
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
                  <p className="font-semibold text-professional-purple mb-1">Release Assistant</p>
                )}
                <p className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</p>
                <p className="text-xs text-muted-foreground mt-1 text-right">{message.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t dark:border-gray-700">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }} className="relative">
          <Textarea
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create or manage releases..."
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

export default ReleaseChat;
