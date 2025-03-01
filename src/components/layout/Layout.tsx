
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import DocumentationChat from '../dashboard/DocumentationChat';

interface LayoutProps {
  children: React.ReactNode;
  showDocChat?: boolean;
}

export const Layout = ({ children, showDocChat = false }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-background">{children}</main>
      {showDocChat && <DocumentationChat />}
      <Footer />
    </div>
  );
};
