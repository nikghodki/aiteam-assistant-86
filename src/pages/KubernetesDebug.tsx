
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';

const KubernetesDebug = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-professional-gray-light/50">
      <Header />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
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
      </main>
      
      <Footer />
    </div>
  );
};

export default KubernetesDebug;
