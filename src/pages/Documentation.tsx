
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DocumentationSearch from '@/components/dashboard/DocumentationSearch';
import DocumentationChat from '@/components/dashboard/DocumentationChat';

const Documentation = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold">Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Search your company documentation for answers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-muted/30 rounded-lg p-6">
                <DocumentationSearch />
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className="bg-muted/30 rounded-lg p-6 h-full">
                <DocumentationChat showInline={true} />
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Documentation;
