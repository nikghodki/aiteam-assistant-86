
import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, RefreshCw, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { docsApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface DocumentationChatProps {
  showInline?: boolean;
}

const DocumentationChat = ({ showInline = false }: DocumentationChatProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [minimized, setMinimized] = useState(false);

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
        content: "Hello! I'm your documentation assistant. How can I help you today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  }, []);

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
      const response = await docsApi.chatWithAssistant(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
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
  
  const clearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        content: "Hello! I'm your documentation assistant. How can I help you today?",
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  };

  // If showing inline, render a different layout
  if (showInline) {
    return (
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bot size={18} className="text-primary" />
            <h3 className="font-medium text-sm">Documentation Assistant</h3>
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
        <div className="flex-1 p-3 overflow-y-auto min-h-[350px] max-h-[400px]">
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
                  "p-3 rounded-lg text-sm",
                  message.sender === 'user' 
                    ? "bg-primary text-primary-foreground rounded-tr-none" 
                    : "bg-muted rounded-tl-none"
                )}>
                  {message.content}
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
                <div className="p-3 rounded-lg text-sm bg-muted rounded-tl-none">
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
        
        {/* Chat input */}
        <form 
          onSubmit={handleSendMessage} 
          className="border-t p-3 flex items-end space-x-2"
        >
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>
      </div>
    );
  }

  // Original floating chat UI for non-inline mode
  return (
    <div className={cn(
      "fixed bottom-20 right-8 w-80 md:w-96 bg-card/90 backdrop-blur-sm rounded-lg shadow-lg border transition-all duration-200 ease-in-out z-50",
      minimized ? "h-14" : "h-[450px]"
    )}>
      {/* Chat header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Bot size={18} className="text-primary" />
          <h3 className="font-medium text-sm">Documentation Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={clearChat}
            className="p-1 rounded-full hover:bg-muted-foreground/10"
            title="Clear chat"
          >
            <XCircle size={16} />
          </button>
          <button 
            onClick={() => setMinimized(!minimized)}
            className="p-1 rounded-full hover:bg-muted-foreground/10"
            title={minimized ? "Expand" : "Minimize"}
          >
            {minimized ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Chat messages */}
      {!minimized && (
        <>
          <div className="flex-1 p-3 overflow-y-auto h-[350px]">
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
                    "p-3 rounded-lg text-sm",
                    message.sender === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-muted rounded-tl-none"
                  )}>
                    {message.content}
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
                  <div className="p-3 rounded-lg text-sm bg-muted rounded-tl-none">
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
          
          {/* Chat input */}
          <form 
            onSubmit={handleSendMessage} 
            className="border-t p-3 flex items-end space-x-2"
          >
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask a question..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="p-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default DocumentationChat;
