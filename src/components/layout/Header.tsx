
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Server, Database, Terminal, Search, Menu, X, User, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Server },
    { name: 'Access Control', href: '/access', icon: Database },
    { name: 'Kubernetes', href: '/kubernetes', icon: Terminal },
    { name: 'Documentation', href: '/docs', icon: Search },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 py-4",
        isScrolled ? "bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="flex items-center gap-2 text-primary font-medium text-lg transition-opacity hover:opacity-80"
        >
          <Terminal size={24} className="text-primary" />
          <span className="font-semibold tracking-tight">AI Team Assistant</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium nav-item transition-colors",
                location.pathname === item.href || location.pathname.startsWith(item.href + '/') 
                  ? "text-professional-purple" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon size={16} className={location.pathname === item.href || location.pathname.startsWith(item.href + '/') ? "text-professional-purple" : ""} />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Profile */}
        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-professional-purple/10 flex items-center justify-center text-professional-purple">
                {user.name ? user.name.charAt(0) : <User size={14} />}
              </div>
              <span className="font-medium">{user.name?.split(' ')[0]}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-3 py-2 text-sm text-muted-foreground">{user.email}</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-foreground focus:outline-none"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border animate-fade-in">
          <div className="max-w-7xl mx-auto py-4 px-6 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 py-2 text-sm font-medium transition-colors",
                  location.pathname === item.href || location.pathname.startsWith(item.href + '/') 
                    ? "text-professional-purple" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon size={18} className={location.pathname === item.href || location.pathname.startsWith(item.href + '/') ? "text-professional-purple" : ""} />
                {item.name}
              </Link>
            ))}
            
            <Link
              to="/profile"
              className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <User size={18} />
              Profile
            </Link>
            
            <Link
              to="/settings"
              className="flex items-center gap-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Settings size={18} />
              Settings
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
