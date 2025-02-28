
import { useState } from 'react';
import { Terminal, AlertCircle, CheckCircle, Play, Trash, Save } from 'lucide-react';
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

  const runCommand = () => {
    if (!command.trim()) return;
    
    setLoading(true);
    
    // In a real app, this would call your Python backend
    setTimeout(() => {
      setOutput(`
# Running: ${command}

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

  return (
    <div className="space-y-6">
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
