
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
import Kubernetes from "./pages/Kubernetes";
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
import Login from "./pages/Login";
import Fallback from "./pages/Fallback";
import ApiDebug from "./pages/ApiDebug";
import SamlSetup from "./pages/SamlSetup"; // Import the new SAML setup page

// Create a client with better error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Simple loading component for suspense
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center p-6">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p className="mt-4">Loading...</p>
    </div>
  </div>
);

const App = () => {
  console.log("App component rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RBACProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              
              <Routes>
                {/* Public routes - must be accessible without auth */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/fallback" element={<Fallback />} />
                <Route path="/api-debug" element={<ApiDebug />} />
                
                {/* Auth callback routes - must not redirect if not authenticated */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="auth/callback" element={<AuthCallback />} />
                <Route path="*/auth/callback" element={<AuthCallback />} />
                <Route path="/*/auth/callback" element={<AuthCallback />} />
                
                {/* Protected routes - all require authentication */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/access" element={<ProtectedRoute><AccessControl /></ProtectedRoute>} />
                <Route path="/kubernetes" element={<ProtectedRoute><Kubernetes /></ProtectedRoute>} />
                <Route path="/docs" element={<ProtectedRoute><Documentation /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/jira" element={<ProtectedRoute><JiraTicket /></ProtectedRoute>} />
                <Route path="/roles" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
                <Route path="/sandbox" element={<ProtectedRoute><SandboxOrchestration /></ProtectedRoute>} />
                <Route path="/release" element={<ProtectedRoute><ReleaseDeployment /></ProtectedRoute>} />
                <Route path="/saml-setup" element={<ProtectedRoute><SamlSetup /></ProtectedRoute>} />
                
                {/* Catch all route for 404 errors */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </RBACProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
