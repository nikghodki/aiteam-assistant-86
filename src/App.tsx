
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RBACProvider } from "@/contexts/RBACContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
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
              <Route path="/login" element={<Login />} />
              
              {/* All other routes are protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/access" element={
                <ProtectedRoute>
                  <AccessControl />
                </ProtectedRoute>
              } />
              <Route path="/kubernetes" element={
                <ProtectedRoute>
                  <KubernetesDebug />
                </ProtectedRoute>
              } />
              <Route path="/docs" element={
                <ProtectedRoute>
                  <Documentation />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/jira" element={
                <ProtectedRoute>
                  <JiraTicket />
                </ProtectedRoute>
              } />
              <Route path="/roles" element={
                <ProtectedRoute>
                  <RoleManagement />
                </ProtectedRoute>
              } />
              <Route path="/sandbox" element={
                <ProtectedRoute>
                  <SandboxOrchestration />
                </ProtectedRoute>
              } />
              <Route path="/releases" element={
                <ProtectedRoute>
                  <ReleaseDeployment />
                </ProtectedRoute>
              } />
              
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
