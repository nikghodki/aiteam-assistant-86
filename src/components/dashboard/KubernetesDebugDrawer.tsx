
import React, { useEffect, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
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
  debugFilePath?: string;
}

const KubernetesDebugDrawer: React.FC<KubernetesDebugDrawerProps> = ({
  isOpen,
  onClose,
  debugSession,
  issue,
  debugFilePath,
}) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState<string | null>(null);
  const [debugFileContent, setDebugFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);

  // Load debug file content when the path is provided
  useEffect(() => {
    if (debugFilePath && isOpen) {
      setIsLoadingFile(true);
      
      // In a real implementation, this would be an API call to fetch the file content
      // For demo purposes, we'll simulate fetching the file after a brief delay
      const timer = setTimeout(() => {
        // This is a placeholder for actual file loading logic
        // In a real app, you would make an API call to fetch the file content
        fetch(debugFilePath)
          .then(response => response.text())
          .then(content => {
            setDebugFileContent(content);
            setIsLoadingFile(false);
          })
          .catch(error => {
            console.error('Error loading debug file:', error);
            setIsLoadingFile(false);
            toast({
              title: "Error",
              description: "Failed to load debugging information",
              variant: "destructive"
            });
          });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [debugFilePath, isOpen, toast]);

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

  // Determine which log to use - either from the debug session or the file
  const logToUse = debugFileContent || (debugSession ? debugSession.debugLog : '');
  
  const { request, sections } = formatDebugLog(logToUse);

  // Format timestamp for messages
  const getTimeStamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Darker background colors for namespace section
  const getNamespaceBackgroundColor = () => {
    return issue?.severity === 'critical' ? 'bg-red-950 text-red-50' :
           issue?.severity === 'high' ? 'bg-orange-950 text-orange-50' :
           issue?.severity === 'medium' ? 'bg-amber-950 text-amber-50' :
           'bg-professional-gray-dark text-green-50';
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-auto">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl">Kubernetes Troubleshooting</SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </SheetClose>
          </div>
          {issue && (
            <SheetDescription>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm rounded-lg overflow-hidden border border-border/30">
                  <div className="font-medium p-2 bg-muted/70">Kind:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{issue.kind}</div>
                  
                  <div className="font-medium p-2 bg-muted/70">Name:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{issue.name}</div>
                  
                  <div className="font-medium p-2 bg-muted/70">Namespace:</div>
                  <div className={cn("col-span-2 p-2", getNamespaceBackgroundColor())}>{issue.namespace}</div>
                  
                  <div className="font-medium p-2 bg-muted/70">Severity:</div>
                  <div className="col-span-2 p-2 bg-muted/40">
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
                  
                  <div className="font-medium p-2 bg-muted/70">Issue:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{Array.isArray(issue.message) ? issue.message.join(', ') : issue.message}</div>
                </div>
              </div>
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div className="py-4">
          {isLoadingFile ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-2">
                  <div className="w-3 h-3 bg-primary/70 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-primary/70 rounded-full animate-bounce delay-200"></div>
                  <div className="w-3 h-3 bg-primary/70 rounded-full animate-bounce delay-300"></div>
                </div>
                <p className="text-sm text-muted-foreground">Loading debugging information...</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              {request && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-[85%] shadow-sm">
                    <div className="text-sm">
                      <p className="font-semibold text-primary-foreground mb-1">You</p>
                      <p className="whitespace-pre-wrap break-words">{request}</p>
                      <p className="text-xs text-muted-foreground mt-1 text-right">{getTimeStamp()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {sections.length > 0 ? (
                <div className="space-y-4">
                  {sections.map((section, index) => (
                    <div key={index} className={`flex ${section.type === 'text' ? 'justify-end' : 'justify-start'} mb-2`}>
                      {section.type === 'text' ? (
                        <div className="bg-primary/10 rounded-lg p-3 max-w-[85%] shadow-sm">
                          <div className="text-sm">
                            <p className="font-semibold text-primary-foreground mb-1">K8s Assistant</p>
                            <p className="whitespace-pre-wrap break-words">{section.content}</p>
                            <p className="text-xs text-muted-foreground mt-1 text-right">{getTimeStamp()}</p>
                          </div>
                        </div>
                      ) : section.type === 'command' ? (
                        <div className="w-[85%]">
                          <div className="bg-gradient-terminal text-white p-3 rounded-lg font-mono text-sm shadow-sm relative mb-1">
                            <pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">{section.content}</pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 bg-black/20 hover:bg-black/40 text-white"
                              onClick={() => copyToClipboard(section.content, `cmd-${index}`)}
                            >
                              {copying === `cmd-${index}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground ml-2">Try this command ↑</p>
                        </div>
                      ) : (
                        <div className="w-[85%]">
                          <div className="bg-muted/30 p-3 rounded-lg text-sm border border-border/40 shadow-sm mb-1">
                            <pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">{section.content}</pre>
                          </div>
                          <p className="text-xs text-muted-foreground ml-2">Command output</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !request && (
                  <Alert>
                    <AlertDescription>
                      No debugging information is available. Please start a debugging session by selecting an issue or asking a question in the Kubernetes Assistant.
                    </AlertDescription>
                  </Alert>
                )
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default KubernetesDebugDrawer;
