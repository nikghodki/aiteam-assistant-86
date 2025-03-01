
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import KubernetesDebugger from '@/components/dashboard/KubernetesDebugger';

const KubernetesDebug = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Kubernetes Debugger</h1>
            <p className="text-muted-foreground mt-1">
              Troubleshoot and resolve Kubernetes issues with the AI-connected debugger
            </p>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-6">
            <KubernetesDebugger />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default KubernetesDebug;
