
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { docsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

// Define the ChatResponse type to match what the API returns
interface ChatResponse {
  response: string;
  filePath?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachedFile?: string;
}

const SampleMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your documentation assistant. How can I help you today?',
    timestamp: new Date(new Date().getTime() - 60000),
  },
];

interface DocumentationChatProps {
  onDebugFilePath?: (path: string) => void;
  showInline?: boolean;
}

// Function to extract file path from assistant's response
const extractFilePath = (message: string): string | null => {
  const filePathRegex = /\[View File\]\((.*?)\)/;
  const match = message.match(filePathRegex);
  return match ? match[1] : null;
};

// Function to get simplified content without file references
const getSimplifiedContent = (message: string): string => {
  // Remove file reference syntax
  return message.replace(/\[View File\]\(.*?\)/g, '');
};

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

const DocumentationChat: React.FC<DocumentationChatProps> = ({ onDebugFilePath, showInline = false }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(SampleMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [debugFilePath, setDebugFilePath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Maintain scroll position when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const resetChat = () => {
    setMessages(SampleMessages);
    setDebugFilePath(null);
  };

  const toggleChat = () => {
    setMinimized(!minimized);
  };

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
      // Get the response from the documentation assistant
      const chatResponse: ChatResponse = await docsApi.chatWithAssistant(inputMessage);
      
      // Extract file path from response if present
      const filePath = chatResponse.filePath || extractFilePath(chatResponse.response);
      if (filePath) {
        setDebugFilePath(filePath);
      }
      
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: chatResponse.response ? getSimplifiedContent(chatResponse.response) : '',
        timestamp: new Date(),
        attachedFile: filePath || undefined,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // If debug file path is available and there's a callback to handle it
      if (debugFilePath && onDebugFilePath) {
        onDebugFilePath(debugFilePath);
      }

      // Invalidate the doc-history query to refresh the dashboard stats
      // This ensures the documentation queries count is updated in the dashboard
      console.log("Invalidating doc-history query to update counter...");
      await queryClient.invalidateQueries({ queryKey: ['doc-history'] });
      console.log("Documentation query count updated after chat message");
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response from the documentation assistant',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If showing inline (in the Documentation page), render a different layout
  if (showInline) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={cn("p-3 rounded-lg max-w-[75%] shadow-sm",
                message.role === 'user' ? "bg-gray-100 dark:bg-gray-700 text-right" : "bg-professional-purple-light/10 dark:bg-professional-purple-dark/10"
              )}>
                <div className="text-sm">
                  {message.role === 'user' ? (
                    <p className="font-semibold text-professional-purple dark:text-professional-purple-light mb-1">You</p>
                  ) : (
                    <p className="font-semibold text-primary-foreground mb-1">Assistant</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</p>
                  {message.attachedFile && (
                    <a href={message.attachedFile} target="_blank" rel="noopener noreferrer" className="text-xs text-professional-blue-DEFAULT underline">
                      View File
                    </a>
                  )}
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
              placeholder="Ask me anything about the documentation..."
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
  }

  // Original floating chat UI for the dashboard
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 rounded-md shadow-lg overflow-hidden transition-all duration-300 ease-in-out",
      minimized ? "w-96 h-12 hover:h-64" : "w-96 h-64"
    )}>
      <div className="bg-gradient-to-r from-professional-purple-light to-professional-blue-light text-white p-3 cursor-pointer select-none" onClick={toggleChat}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Documentation Assistant</h4>
          <div className="flex items-center space-x-2">
            <button onClick={(e) => {
              e.stopPropagation();
              resetChat();
            }} className="hover:text-gray-200 transition-colors duration-200">
              <RefreshCw size={16} />
            </button>
            <button onClick={(e) => {
              e.stopPropagation();
              setMinimized(true);
            }} className="hover:text-gray-200 transition-colors duration-200">
              <XCircle size={16} />
            </button>
          </div>
        </div>
      </div>
      {!minimized && (
        <div className="flex flex-col h-52 bg-white dark:bg-gray-800">
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={`flex items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={cn("p-3 rounded-lg max-w-[75%] shadow-sm",
                  message.role === 'user' ? "bg-gray-100 dark:bg-gray-700 text-right" : "bg-professional-purple-light/10 dark:bg-professional-purple-dark/10"
                )}>
                  <div className="text-sm">
                    {message.role === 'user' ? (
                      <p className="font-semibold text-professional-purple dark:text-professional-purple-light mb-1">You</p>
                    ) : (
                      <p className="font-semibold text-primary-foreground mb-1">Assistant</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</p>
                    {message.attachedFile && (
                      <a href={message.attachedFile} target="_blank" rel="noopener noreferrer" className="text-xs text-professional-blue-DEFAULT underline">
                        View File
                      </a>
                    )}
                    <p className="text-xs text-muted-foreground mt-1 text-right">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t dark:border-gray-700">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }} className="relative">
              <Textarea
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about the documentation..."
                className="w-full pr-10 resize-none border-none shadow-sm focus:ring-0 focus-visible:ring-0 dark:bg-gray-700"
                rows={1}
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
      )}
    </div>
  );
};

export default DocumentationChat;
