
import React, { useState, useEffect } from 'react';
import { Ticket, ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { jiraApi } from '@/services/api';

interface JiraTicket {
  key: string;
  url: string;
  summary: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  createdAt: Date;
}

interface JiraTicketListProps {
  refreshTrigger?: number;
}

const JiraTicketList = ({ refreshTrigger = 0 }: JiraTicketListProps) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<JiraTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      
      try {
        // Fetch tickets from the API
        const userTickets = await jiraApi.getUserTickets();
        
        // Transform the API response to match our JiraTicket interface
        const transformedTickets = userTickets.map((ticket: any) => ({
          key: ticket.key,
          url: ticket.url || `https://jira.example.com/browse/${ticket.key}`,
          summary: ticket.summary || ticket.title || 'No summary available',
          description: ticket.description || 'No description available',
          status: ticket.status || 'Open',
          priority: ticket.priority || 'Medium',
          createdAt: new Date(ticket.created || ticket.createdAt || Date.now())
        }));
        
        setTickets(transformedTickets);
      } catch (error) {
        console.error('Error fetching Jira tickets:', error);
        
        // Fallback to localStorage if API fails
        const savedTickets = localStorage.getItem('jiraTickets');
        if (savedTickets) {
          const parsedTickets = JSON.parse(savedTickets).map((ticket: any) => ({
            ...ticket,
            createdAt: new Date(ticket.createdAt)
          }));
          setTickets(parsedTickets);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, [refreshTrigger]);

  // Save tickets to localStorage as backup
  useEffect(() => {
    if (tickets.length > 0) {
      localStorage.setItem('jiraTickets', JSON.stringify(tickets));
    }
  }, [tickets]);

  // Function to add a mock ticket (for demo purposes)
  const addMockTicket = () => {
    const mockTicket: JiraTicket = {
      key: `JIRA-${Math.floor(1000 + Math.random() * 9000)}`,
      url: `https://jira.example.com/browse/JIRA-${Math.floor(1000 + Math.random() * 9000)}`,
      summary: 'Sample ticket for demonstration',
      description: 'This is a sample ticket created for demonstration purposes.',
      status: Math.random() > 0.5 ? 'Open' : 'In Progress',
      priority: Math.random() > 0.7 ? 'High' : Math.random() > 0.4 ? 'Medium' : 'Low',
      createdAt: new Date()
    };
    
    setTickets(prev => [mockTicket, ...prev]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'bg-blue-500';
      case 'In Progress':
        return 'bg-yellow-500';
      case 'Resolved':
        return 'bg-green-500';
      case 'Closed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'text-red-500 border-red-200 bg-red-50';
      case 'Medium':
        return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'Low':
        return 'text-green-600 border-green-200 bg-green-50';
      default:
        return 'text-blue-600 border-blue-200 bg-blue-50';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="h-[600px] max-h-[600px] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          {tickets.length} {tickets.length === 1 ? 'ticket' : 'tickets'}
        </div>
        
        {/* For demo purposes - add a mock ticket button */}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addMockTicket}
          className="text-xs"
        >
          <Ticket size={12} className="mr-1" />
          Add Demo Ticket
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-muted-foreground">
            <div className="w-6 h-6 border-2 border-t-primary rounded-full animate-spin mb-2"></div>
            <span className="text-xs">Loading tickets...</span>
          </div>
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center text-muted-foreground">
            <AlertCircle size={24} className="mb-2 opacity-50" />
            <span className="text-sm">No tickets found</span>
            <p className="text-xs mt-1 text-center max-w-[200px]">
              Use the chat assistant to create your first Jira ticket.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.key}
                className="p-3 bg-card border border-border/30 rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <div className={cn("w-2 h-2 rounded-full mr-2", getStatusColor(ticket.status))}></div>
                    <a 
                      href={ticket.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline flex items-center"
                    >
                      {ticket.key}
                      <ExternalLink size={12} className="ml-1 opacity-70" />
                    </a>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs px-1.5 py-0", getPriorityColor(ticket.priority))}
                  >
                    {ticket.priority}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-sm mb-1 line-clamp-2">{ticket.summary}</h4>
                
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {ticket.description}
                </p>
                
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(ticket.createdAt)}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {ticket.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JiraTicketList;
