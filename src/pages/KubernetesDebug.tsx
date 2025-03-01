
import { Layout } from '@/components/layout/Layout';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';

const KubernetesDebug = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Kubernetes Debugger</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Troubleshoot and resolve Kubernetes issues with the AI-connected debugger. Select your environment and cluster to start debugging.
          </p>
        </div>
        
        <div className="rounded-lg">
          <KubernetesDebugger />
        </div>
      </div>
    </Layout>
  );
};

export default KubernetesDebug;
