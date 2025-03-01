
import { Layout } from '@/components/layout/Layout';
import AccessManagement from '@/components/dashboard/AccessManagement';
import { useAuth } from '@/contexts/AuthContext';

const AccessControl = () => {
  const { user } = useAuth();
  
  return (
    <Layout>
      <div className="space-y-8">
        <div className="bg-gradient-professional p-8 rounded-lg shadow-sm border border-border/30">
          <h1 className="text-3xl font-bold text-foreground">Access Control</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Manage group memberships and access requests
          </p>
          {user && (
            <p className="text-sm mt-2">
              Logged in as: <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>
        
        <div className="bg-muted/30 backdrop-blur-sm rounded-lg p-6 border border-border/50 shadow-sm">
          <AccessManagement />
        </div>
      </div>
    </Layout>
  );
};

export default AccessControl;
