
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import GlassMorphicCard from "@/components/ui/GlassMorphicCard";
import { Separator } from "@/components/ui/separator";
import JiraTicketChat from "@/components/jira/JiraTicketChat";
import JiraTicketList from "@/components/jira/JiraTicketList";

const JiraTicket = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback function to refresh the ticket list when a new ticket is created
  const handleTicketCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 md:px-6">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Jira Ticket Creation</h1>
          <p className="text-muted-foreground">
            Chat with our assistant to create and manage Jira tickets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Chat Assistant Section - 3/5 width on medium screens and above */}
          <div className="md:col-span-3">
            <GlassMorphicCard className="h-full">
              <div className="p-4 h-full flex flex-col">
                <h2 className="text-xl font-semibold mb-2">Chat Assistant</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your issue and let our assistant help you create a Jira ticket.
                </p>
                <Separator className="my-2" />
                <div className="flex-grow overflow-hidden">
                  <JiraTicketChat onTicketCreated={handleTicketCreated} />
                </div>
              </div>
            </GlassMorphicCard>
          </div>

          {/* Tickets List Section - 2/5 width on medium screens and above */}
          <div className="md:col-span-2">
            <GlassMorphicCard className="h-full">
              <div className="p-4 h-full flex flex-col">
                <h2 className="text-xl font-semibold mb-2">Your Tickets</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  View and track your created Jira tickets.
                </p>
                <Separator className="my-2" />
                <div className="flex-grow overflow-hidden">
                  <JiraTicketList refreshTrigger={refreshTrigger} />
                </div>
              </div>
            </GlassMorphicCard>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JiraTicket;
