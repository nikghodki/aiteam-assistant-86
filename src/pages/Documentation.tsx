
import { Layout } from '@/components/layout/Layout';
import DocumentationSearch from '@/components/dashboard/DocumentationSearch';
import DocumentationChat from '@/components/dashboard/DocumentationChat';

const Documentation = () => {
  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Search your company documentation for answers
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 border border-border/50 shadow-sm">
              <DocumentationSearch />
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 h-full border border-border/50 shadow-sm">
              <DocumentationChat showInline={true} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Documentation;
