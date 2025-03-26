
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import AccessControl from "./pages/AccessControl";
import KubernetesDebug from "./pages/KubernetesDebug";
import Documentation from "./pages/Documentation";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import JiraTicket from "./pages/JiraTicket";
import RoleManagement from "./pages/RoleManagement";
import SandboxOrchestration from "./pages/SandboxOrchestration";
import ReleaseDeployment from "./pages/ReleaseDeployment";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RBACProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Auth callback - need to catch ALL variations */}
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              <Route path="*/auth/callback" element={<AuthCallback />} />
              <Route path="/*/auth/callback" element={<AuthCallback />} />
              
              <Route path="/" element={<Index />} />
              {/* Redirect login to dashboard for testing */}
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/access" element={<AccessControl />} />
              <Route path="/kubernetes" element={<KubernetesDebug />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/jira" element={<JiraTicket />} />
              <Route path="/roles" element={<RoleManagement />} />
              <Route path="/sandbox" element={<SandboxOrchestration />} />
              <Route path="/release" element={<ReleaseDeployment />} />
              {/* Catch all route for 404 errors */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RBACProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
