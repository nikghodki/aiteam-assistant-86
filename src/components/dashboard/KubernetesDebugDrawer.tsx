
import React from 'react';
import { Check, Copy, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../ui/sheet';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface KubernetesDebugDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  debugSession: {
    id: string;
    debugLog: string;
  } | null;
  issue?: {
    kind: string;
    name: string;
    message: string;
    severity: string;
    namespace: string;
  };
}

const KubernetesDebugDrawer: React.FC<KubernetesDebugDrawerProps> = ({
  isOpen,
  onClose,
  debugSession,
  issue,
}) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState<string | null>(null);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopying(identifier);
    
    toast({
      title: "Copied to clipboard",
      description: "Command has been copied to your clipboard",
    });
    
    setTimeout(() => setCopying(null), 2000);
  };

  // Format debug log to extract sections
  const formatDebugLog = (log: string) => {
    if (!log) return { request: '', response: '', sections: [] };

    // Split into Request and Response sections
    const requestMatch = log.match(/## Request\n([\s\S]+?)(?=\n## Response|\n$)/);
    const responseMatch = log.match(/## Response\n([\s\S]+)/);

    const request = requestMatch ? requestMatch[1].trim() : '';
    const responseRaw = responseMatch ? responseMatch[1].trim() : '';

    // Parse code blocks and sections from the response
    const sections: { type: 'text' | 'command' | 'output'; content: string; }[] = [];
    
    if (responseRaw) {
      // Split by code blocks
      const parts = responseRaw.split(/```(?:bash|yaml|json|sh)?([\s\S]+?)```/g);
      
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          // Text content between code blocks
          if (part.trim()) {
            sections.push({ type: 'text', content: part.trim() });
          }
        } else {
          // Code block content
          const trimmedPart = part.trim();
          if (trimmedPart.startsWith('kubectl') || trimmedPart.startsWith('helm') || trimmedPart.startsWith('k9s')) {
            sections.push({ type: 'command', content: trimmedPart });
          } else {
            sections.push({ type: 'output', content: trimmedPart });
          }
        }
      });
    }

    return { request, response: responseRaw, sections };
  };

  const { request, sections } = debugSession ? formatDebugLog(debugSession.debugLog) : { request: '', sections: [] };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-auto">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl">Kubernetes Debugging Steps</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
          {issue && (
            <SheetDescription>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Kind:</div>
                  <div className="col-span-2">{issue.kind}</div>
                  
                  <div className="font-medium">Name:</div>
                  <div className="col-span-2">{issue.name}</div>
                  
                  <div className="font-medium">Namespace:</div>
                  <div className="col-span-2">{issue.namespace}</div>
                  
                  <div className="font-medium">Severity:</div>
                  <div className="col-span-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      issue.severity === 'critical' && "bg-red-100 text-red-800",
                      issue.severity === 'high' && "bg-orange-100 text-orange-800",
                      issue.severity === 'medium' && "bg-amber-100 text-amber-800",
                      issue.severity === 'low' && "bg-green-100 text-green-800"
                    )}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </span>
                  </div>
                  
                  <div className="font-medium">Issue:</div>
                  <div className="col-span-2">{issue.message}</div>
                </div>
              </div>
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div className="py-4 space-y-6">
          {request && (
            <div>
              <h3 className="text-md font-semibold mb-2">Request</h3>
              <div className="bg-muted/40 rounded-md p-4 text-sm whitespace-pre-wrap">
                {request}
              </div>
            </div>
          )}
          
          {sections.length > 0 && (
            <div>
              <h3 className="text-md font-semibold mb-2">Debugging Steps</h3>
              <div className="space-y-4">
                {sections.map((section, index) => (
                  <div key={index} className="space-y-2">
                    {section.type === 'text' ? (
                      <div className="text-sm">{section.content}</div>
                    ) : section.type === 'command' ? (
                      <div className="relative">
                        <div className="bg-gradient-terminal text-white p-3 rounded-md font-mono text-sm overflow-auto">
                          <pre className="whitespace-pre-wrap">{section.content}</pre>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                          onClick={() => copyToClipboard(section.content, `cmd-${index}`)}
                        >
                          {copying === `cmd-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-muted/30 p-3 rounded-md text-sm overflow-auto border border-border/40">
                        <pre className="whitespace-pre-wrap">{section.content}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!request && sections.length === 0 && (
            <Alert>
              <AlertDescription>
                No debugging information is available. Please start a debugging session by selecting an issue or asking a question in the Kubernetes Assistant.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KubernetesDebugDrawer;
