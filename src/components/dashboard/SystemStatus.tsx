
import GlassMorphicCard from '@/components/ui/GlassMorphicCard';

const SystemStatus = () => {
  return (
    <GlassMorphicCard>
      <div className="p-5 border-b bg-muted/20">
        <h3 className="text-lg font-medium">System Status</h3>
      </div>
      
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Access System</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Kubernetes API</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">All clusters connected</p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Documentation</h4>
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">Indexed and up-to-date</p>
          </div>
          
          <div className="border rounded-md p-3 hover-scale">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Jira Integration</h4>
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            </div>
            <p className="text-xs text-muted-foreground">Partial degradation</p>
          </div>
        </div>
      </div>
    </GlassMorphicCard>
  );
};

export default SystemStatus;
