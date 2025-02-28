
import { useState } from 'react';
import { Terminal, AlertCircle, CheckCircle, Play, Trash, Save, Send, Server } from 'lucide-react';
import GlassMorphicCard from '../ui/GlassMorphicCard';
import { cn } from '@/lib/utils';

const KubernetesDebugger = () => {
  const [command, setCommand] = useState('kubectl get pods -n default');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([
    'kubectl get pods -n monitoring',
    'kubectl describe pod prometheus-0 -n monitoring',
    'kubectl logs -n kube-system -l k8s-app=kube-dns'
  ]);
  const [selectedCluster, setSelectedCluster] = useState('production');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'How can I help you debug your Kubernetes cluster today?' }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Available clusters
  const clusters = [
    { id: 'production', name: 'Production', status: 'healthy' },
    { id: 'staging', name: 'Staging', status: 'warning' },
    { id: 'development', name: 'Development', status: 'healthy' },
    { id: 'test', name: 'Test Environment', status: 'error' }
  ];

  const runCommand = () => {
    if (!command.trim()) return;
    
    setLoading(true);
    
    // In a real app, this would call your Python backend
    setTimeout(() => {
      setOutput(`
# Running: ${command} on cluster: ${selectedCluster}

NAME                                      READY   STATUS    RESTARTS   AGE
nginx-deployment-66b6c48dd5-7lck2         1/1     Running   0          3d
nginx-deployment-66b6c48dd5-k2hrn         1/1     Running   0          3d
api-gateway-deployment-5f7b9d8c67-abcd1   1/1     Running   0          1d
api-gateway-deployment-5f7b9d8c67-wxyz2   0/1     Error     3          1d
redis-master-0                            1/1     Running   0          12h
redis-replica-0                           1/1     Running   0          12h
redis-replica-1                           1/1     Running   0          12h
      `.trim());
      
      if (!history.includes(command)) {
        setHistory(prev => [command, ...prev].slice(0, 10));
      }
      
      setLoading(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runCommand();
  };

  const handleHistoryClick = (cmd: string) => {
    setCommand(cmd);
  };

  const clearOutput = () => {
    setOutput('');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = { role: 'user' as const, content: message };
    setChatHistory(prev => [...prev, userMessage]);
    setChatLoading(true);
    setMessage('');

    // In a real app, this would call your Python backend
    setTimeout(() => {
      // Simulate assistant response
      let response = "";
      if (message.toLowerCase().includes('pod') && message.toLowerCase().includes('error')) {
        response = "I see there's an issue with one of your pods. Let me help diagnose that. The api-gateway-deployment-5f7b9d8c67-wxyz2 pod is showing an Error status. We should check the logs for this pod first. Try running: `kubectl logs api-gateway-deployment-5f7b9d8c67-wxyz2 -n default`";
      } else if (message.toLowerCase().includes('restart')) {
        response = "If you want to restart a deployment, you can use: `kubectl rollout restart deployment/api-gateway-deployment -n default`";
      } else if (message.toLowerCase().includes('health') || message.toLowerCase().includes('status')) {
        response = "The cluster overall health is good, but there's one pod in an error state. Would you like me to show you some troubleshooting steps for that pod?";
      } else {
        response = "I understand you're looking for help with Kubernetes. Could you provide more specific details about what you're trying to debug or which resources you're concerned about?";
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
      setChatLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Cluster Selector */}
      <div className="flex items-center space-x-4 pb-4">
        <div className="text-sm font-medium">Select Cluster:</div>
        <div className="flex gap-2 flex-wrap">
          {clusters.map((cluster) => (
            <button
              key={cluster.id}
              onClick={() => setSelectedCluster(cluster.id)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors",
                selectedCluster === cluster.id
                  ? "bg-primary text-white border-primary"
                  : "bg-background border-input hover:bg-muted"
              )}
            >
              <Server size={14} />
              <span>{cluster.name}</span>
              <span className={cn(
                "inline-block w-2 h-2 rounded-full ml-1",
                cluster.status === 'healthy' ? "bg-green-500" : 
                cluster.status === 'warning' ? "bg-amber-500" : "bg-red-500"
              )} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassMorphicCard className="md:col-span-3">
          <div className="p-4 border-b bg-muted/40">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Terminal size={16} className="text-muted-foreground" />
                </div>
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                  placeholder="Enter kubectl command..."
                />
              </div>
              <button 
                type="submit"
                className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Play size={14} />
                Run
              </button>
            </form>
          </div>
          
          <div className="relative min-h-[350px] max-h-[450px] overflow-auto bg-gray-900 text-gray-100 p-4 font-mono text-sm">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-gray-300">Running command...</span>
                </div>
              </div>
            ) : null}
            
            {output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span>Command output will appear here</span>
              </div>
            )}
          </div>
          
          {output && (
            <div className="p-3 border-t bg-muted/40 flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={clearOutput}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Trash size={14} />
                  Clear
                </button>
                <button 
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Save size={14} />
                  Save Output
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-500" />
                <span className="text-xs">Found 1 pod with errors</span>
              </div>
            </div>
          )}
        </GlassMorphicCard>
        
        <GlassMorphicCard className="md:col-span-1">
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Command History</h3>
          </div>
          
          <div className="p-3 max-h-[400px] overflow-auto">
            <div className="space-y-2">
              {history.map((cmd, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(cmd)}
                  className={cn(
                    "w-full p-2 text-left text-xs rounded-md transition-colors",
                    cmd === command ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  )}
                >
                  <div className="truncate">{cmd}</div>
                </button>
              ))}
              
              {history.length === 0 && (
                <div className="text-center text-muted-foreground text-xs p-4">
                  <p>No command history yet</p>
                </div>
              )}
            </div>
          </div>
        </GlassMorphicCard>
      </div>

      {/* Natural Language Assistant */}
      <GlassMorphicCard>
        <div className="p-4 border-b bg-muted/40">
          <h3 className="font-medium text-sm">Kubernetes Assistant</h3>
          <p className="text-xs text-muted-foreground mt-1">Ask questions in natural language to debug your Kubernetes issues</p>
        </div>
        
        <div className="p-4 max-h-[400px] overflow-auto flex flex-col">
          <div className="flex-1 space-y-4 mb-4">
            {chatHistory.map((chat, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex",
                  chat.role === 'assistant' ? "justify-start" : "justify-end"
                )}
              >
                <div className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  chat.role === 'assistant' 
                    ? "bg-muted text-foreground rounded-tl-none" 
                    : "bg-primary text-primary-foreground rounded-tr-none"
                )}>
                  {chat.content}
                </div>
              </div>
            ))}
            
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground rounded-lg rounded-tl-none max-w-[80%] p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleChatSubmit} className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <input 
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full pl-4 pr-4 py-2 bg-background border rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="Ask about your Kubernetes issues..."
                disabled={chatLoading}
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={chatLoading || !message.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </GlassMorphicCard>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassMorphicCard>
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Cluster Health</h3>
          </div>
          
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">Control Plane</span>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">etcd</span>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm">Scheduler</span>
                </div>
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Healthy</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  <span className="text-sm">API Gateway</span>
                </div>
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded">Warning</span>
              </div>
            </div>
          </div>
        </GlassMorphicCard>
        
        <GlassMorphicCard>
          <div className="p-4 border-b bg-muted/40">
            <h3 className="font-medium text-sm">Quick Actions</h3>
          </div>
          
          <div className="p-4 grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm">
              <CheckCircle size={18} className="mb-1 text-primary" />
              <span>Health Check</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm">
              <AlertCircle size={18} className="mb-1 text-primary" />
              <span>View Alerts</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm">
              <Terminal size={18} className="mb-1 text-primary" />
              <span>Debug Pod</span>
            </button>
            
            <button className="flex flex-col items-center justify-center p-3 border rounded-md hover:bg-muted transition-colors text-sm">
              <Save size={18} className="mb-1 text-primary" />
              <span>Save Config</span>
            </button>
          </div>
        </GlassMorphicCard>
      </div>
    </div>
  );
};

export default KubernetesDebugger;
