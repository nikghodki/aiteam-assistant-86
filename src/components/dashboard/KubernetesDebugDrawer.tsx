import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, X } from 'lucide-react';
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
import { kubernetesApi, fetchFile } from '@/services/api';

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
  s3FilePath?: string;
  isLoading?: boolean;
}

const KubernetesDebugDrawer: React.FC<KubernetesDebugDrawerProps> = ({
  isOpen,
  onClose,
  debugSession,
  issue,
  debugFilePath,
  s3FilePath,
  isLoading = false,
}) => {
  const { toast } = useToast();
  const [copying, setCopying] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFileContent('');
      setFileError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (s3FilePath && isOpen) {
      console.log('Attempting to fetch S3 file:', s3FilePath);
      setIsLoadingFile(true);
      setFileError(null);
      
      fetchFile(s3FilePath)
        .then(content => {
          console.log('S3 file fetched successfully');
          setFileContent(content);
        })
        .catch(error => {
          console.error('Error fetching S3 file:', error);
          setFileError(`Failed to load S3 file: ${error.message}`);
          toast({
            title: "Error",
            description: "Failed to load debugging file from S3",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsLoadingFile(false);
        });
    }
  }, [s3FilePath, isOpen, toast]);

  useEffect(() => {
    if (debugFilePath && isOpen && !s3FilePath) {
      console.log('Attempting to fetch local file:', debugFilePath);
      setIsLoadingFile(true);
      setFileError(null);
      
      fetch(debugFilePath)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to load file: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(content => {
          console.log('Local file fetched successfully');
          setFileContent(content);
        })
        .catch(error => {
          console.error('Error loading debug file:', error);
          setFileError(`Failed to load file: ${error.message}`);
          toast({
            title: "Error",
            description: "Failed to load debugging information",
            variant: "destructive"
          });
        })
        .finally(() => {
          setIsLoadingFile(false);
        });
    }
  }, [debugFilePath, isOpen, s3FilePath, toast]);

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopying(identifier);
    
    toast({
      title: "Copied to clipboard",
      description: "Command has been copied to your clipboard",
    });
    
    setTimeout(() => setCopying(null), 2000);
  };

  const handleDownload = async () => {
    const contentToDownload = fileContent || (debugSession?.debugLog || '');
    
    if (!contentToDownload) {
      toast({
        title: "Error",
        description: "No debugging information available to download",
        variant: "destructive"
      });
      return;
    }
    
    setIsDownloading(true);
    
    try {
      const blob = new Blob([contentToDownload], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const filename = s3FilePath ? 
        `${s3FilePath.split('/').pop() || 'debug-file'}.txt` : 
        `debug-file-${new Date().getTime()}.txt`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download started",
        description: "Debug file is being downloaded",
      });
    } catch (error) {
      console.error('Error downloading debug file:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the debug file",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDebugLog = (log: string) => {
    if (!log) return { request: '', response: '', sections: [] };

    const requestMatch = log.match(/## Request\n([\s\S]+?)(?=\n## Response|\n$)/);
    const responseMatch = log.match(/## Response\n([\s\S]+)/);

    const request = requestMatch ? requestMatch[1].trim() : '';
    const responseRaw = responseMatch ? responseMatch[1].trim() : '';

    const sections: { type: 'text' | 'command' | 'output'; content: string; }[] = [];
    
    if (responseRaw) {
      const parts = responseRaw.split(/```(?:bash|yaml|json|sh)?([\s\S]+?)```/g);
      
      parts.forEach((part, index) => {
        if (index % 2 === 0) {
          if (part.trim()) {
            sections.push({ type: 'text', content: part.trim() });
          }
        } else {
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

  const logToUse = fileContent || (debugSession?.debugLog || '');
  
  const { request, sections } = formatDebugLog(logToUse);

  const getTimeStamp = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getNamespaceBackgroundColor = () => {
    return issue?.severity === 'critical' ? 'bg-red-950 text-red-50' :
           issue?.severity === 'high' ? 'bg-orange-950 text-orange-50' :
           issue?.severity === 'medium' ? 'bg-amber-950 text-amber-50' :
           'bg-professional-gray-dark text-green-50';
  };

  const getChatBubbleStyle = (type: 'text' | 'command' | 'output') => {
    switch (type) {
      case 'text':
        return 'bg-professional-purple-light/90 dark:bg-professional-purple-dark/80';
      case 'command':
        return 'bg-gradient-terminal';
      case 'output':
        return 'bg-muted/30 dark:bg-muted/20 border border-border/40';
      default:
        return '';
    }
  };

  const getRequestBubbleStyle = () => {
    return 'bg-gray-100 dark:bg-gray-800';
  };

  const showMainLoadingState = isLoading && !debugSession && !fileContent;
  const showFileLoadingState = isLoadingFile;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl overflow-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm">
        <SheetHeader className="pb-4">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl">Kubernetes Troubleshooting</SheetTitle>
            <div className="flex gap-2">
              {(debugSession?.id || fileContent) && (
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleDownload} 
                  disabled={isDownloading}
                  className="h-9 w-9"
                  title="Download debug file"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <SheetClose asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </SheetClose>
            </div>
          </div>
          {issue && (
            <SheetDescription>
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-3 gap-2 text-sm rounded-lg overflow-hidden border border-border/30 shadow-sm">
                  <div className="font-medium p-2 bg-professional-purple-light/20 dark:bg-professional-purple-dark/20">Kind:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{issue.kind}</div>
                  
                  <div className="font-medium p-2 bg-professional-purple-light/20 dark:bg-professional-purple-dark/20">Name:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{issue.name}</div>
                  
                  <div className="font-medium p-2 bg-professional-purple-light/20 dark:bg-professional-purple-dark/20">Namespace:</div>
                  <div className={cn("col-span-2 p-2", getNamespaceBackgroundColor())}>{issue.namespace}</div>
                  
                  <div className="font-medium p-2 bg-professional-purple-light/20 dark:bg-professional-purple-dark/20">Severity:</div>
                  <div className="col-span-2 p-2 bg-muted/40">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      issue.severity === 'critical' && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
                      issue.severity === 'high' && "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
                      issue.severity === 'medium' && "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
                      issue.severity === 'low' && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                    )}>
                      {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                    </span>
                  </div>
                  
                  <div className="font-medium p-2 bg-professional-purple-light/20 dark:bg-professional-purple-dark/20">Issue:</div>
                  <div className="col-span-2 p-2 bg-muted/40">{Array.isArray(issue.message) ? issue.message.join(', ') : issue.message}</div>
                </div>
              </div>
            </SheetDescription>
          )}
        </SheetHeader>
        
        <div className="py-4">
          {showMainLoadingState ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-2">
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-200"></div>
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-300"></div>
                </div>
                <p className="text-sm text-muted-foreground">Getting AI assistance for this issue...</p>
              </div>
            </div>
          ) : showFileLoadingState ? (
            <div className="flex items-center justify-center h-40">
              <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-2">
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-200"></div>
                  <div className="w-3 h-3 bg-professional-purple/70 rounded-full animate-bounce delay-300"></div>
                </div>
                <p className="text-sm text-muted-foreground">Loading debugging information...</p>
              </div>
            </div>
          ) : fileError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col">
              {issue && !debugSession && !fileContent && !showMainLoadingState ? (
                <Alert className="border-professional-purple-light/30 dark:border-professional-purple-dark/30 mb-4">
                  <AlertDescription>
                    Analyzing this issue. The AI assistant will provide debugging steps shortly.
                  </AlertDescription>
                </Alert>
              ) : null}
              
              {request && (
                <div className="flex justify-start mb-4">
                  <div className={cn("rounded-lg p-3 max-w-[85%] shadow-sm", getRequestBubbleStyle())}>
                    <div className="text-sm">
                      <p className="font-semibold text-professional-purple dark:text-professional-purple-light mb-1">You</p>
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
                        <div className={cn("rounded-lg p-3 max-w-[85%] shadow-sm", getChatBubbleStyle(section.type))}>
                          <div className="text-sm">
                            <p className="font-semibold text-primary-foreground mb-1">K8s Assistant</p>
                            <p className="whitespace-pre-wrap break-words">{section.content}</p>
                            <p className="text-xs text-white/70 mt-1 text-right">{getTimeStamp()}</p>
                          </div>
                        </div>
                      ) : section.type === 'command' ? (
                        <div className="w-[85%]">
                          <div className={cn("text-white p-3 rounded-lg font-mono text-sm shadow-sm relative mb-1", getChatBubbleStyle(section.type))}>
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
                          <p className="text-xs text-professional-purple-dark dark:text-professional-purple-light ml-2">Try this command ↑</p>
                        </div>
                      ) : (
                        <div className="w-[85%]">
                          <div className={cn("p-3 rounded-lg text-sm shadow-sm mb-1", getChatBubbleStyle(section.type))}>
                            <pre className="whitespace-pre-wrap overflow-auto max-h-[200px]">{section.content}</pre>
                          </div>
                          <p className="text-xs text-muted-foreground ml-2">Command output</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                !request && !showMainLoadingState && (
                  <Alert className="border-professional-purple-light/30 dark:border-professional-purple-dark/30">
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
