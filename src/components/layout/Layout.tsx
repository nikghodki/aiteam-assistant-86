
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import DocumentationChat from '../dashboard/DocumentationChat';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showDocChat?: boolean;
}

export const Layout = ({ children, showDocChat = false }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAuthenticated = user.authenticated;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Hidden if not authenticated */}
      {isAuthenticated && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Mobile Sidebar Overlay - Only shown for authenticated users */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar - Only shown for authenticated users when menu is open */}
      {isAuthenticated && (
        <div className={cn(
          "fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col w-full",
        isAuthenticated ? "md:pl-64" : "" // Only leave space for sidebar if authenticated
      )}> 
        {isAuthenticated && (
          <Header 
            onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            isMobileMenuOpen={isMobileMenuOpen} 
          />
        )}
        
        <main className="flex-1 px-4 py-6 bg-gradient-to-br from-white to-professional-gray-light/50 dark:from-gray-900 dark:to-gray-800">
          {children}
        </main>
        
        {showDocChat && isAuthenticated && <DocumentationChat />}
        
        {isAuthenticated && <Footer />}
      </div>
    </div>
  );
};

export default Layout;
