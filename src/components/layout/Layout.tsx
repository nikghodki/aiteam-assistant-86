
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import DocumentationChat from '../dashboard/DocumentationChat';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  showDocChat?: boolean;
}

export const Layout = ({ children, showDocChat = false }: LayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Hidden on mobile by default */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Mobile Sidebar - Only shown when menu is open */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full md:pl-64"> {/* Leave space for the sidebar */}
        <Header 
          onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          isMobileMenuOpen={isMobileMenuOpen} 
        />
        
        <main className="flex-1 px-4 py-6 bg-gradient-to-br from-white to-gray-100/50 dark:from-gray-900 dark:to-gray-800">
          {children}
        </main>
        
        {showDocChat && <DocumentationChat />}
        
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
