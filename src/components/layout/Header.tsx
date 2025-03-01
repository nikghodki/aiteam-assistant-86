
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header = ({ onMobileMenuToggle, isMobileMenuOpen }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get page title based on current route
  const getPageTitle = () => {
    if (location.pathname === '/dashboard') return 'Dashboard';
    if (location.pathname === '/access') return 'Access Control';
    if (location.pathname === '/kubernetes') return 'Kubernetes';
    if (location.pathname === '/docs') return 'Documentation';
    if (location.pathname === '/jira') return 'Jira Ticket';
    if (location.pathname === '/profile') return 'Profile';
    if (location.pathname === '/settings') return 'Settings';
    return '';
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-30 transition-all duration-300 ease-in-out px-4 py-3",
        isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">{getPageTitle()}</h1>
        
        {/* Mobile Menu Button - Only shows on mobile */}
        <Button 
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>
    </header>
  );
};

export default Header;
