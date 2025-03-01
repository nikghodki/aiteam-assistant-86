
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Server, 
  Database, 
  Terminal, 
  Search, 
  Ticket, 
  User, 
  Settings, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Server },
    { name: 'Access Control', href: '/access', icon: Database },
    { name: 'Kubernetes', href: '/kubernetes', icon: Terminal },
    { name: 'Documentation', href: '/docs', icon: Search },
    { name: 'Jira Ticket', href: '/jira', icon: Ticket },
  ];

  return (
    <aside className={cn(
      "fixed h-screen bg-white dark:bg-gray-900 border-r border-border flex flex-col transition-all duration-300 z-40",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Link 
          to="/" 
          className={cn(
            "flex items-center gap-2 text-primary font-medium text-lg transition-opacity hover:opacity-80",
            isCollapsed && "justify-center"
          )}
        >
          <Terminal size={24} className="text-professional-purple" />
          {!isCollapsed && <span className="font-semibold tracking-tight">AI Assistant</span>}
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-6 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                  location.pathname === item.href || location.pathname.startsWith(item.href + '/') 
                    ? "bg-professional-purple/10 text-professional-purple" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon size={isCollapsed ? 20 : 16} className={location.pathname === item.href ? "text-professional-purple" : ""} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-border">
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(
            "flex items-center w-full gap-2 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-professional-purple/10 flex items-center justify-center text-professional-purple">
              {user.name ? user.name.charAt(0) : <User size={14} />}
            </div>
            {!isCollapsed && (
              <div className="flex-1 text-left">
                <p className="font-medium truncate">{user.name?.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56">
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
    </aside>
  );
};

export default Sidebar;
