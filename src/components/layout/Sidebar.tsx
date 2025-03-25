
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  Terminal,
  FileText,
  Link,
  Settings,
  User,
  ShieldCheck,
  Box,
  Rocket
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRBAC } from "@/contexts/RBACContext";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { hasPermission } = useRBAC();
  const isLocalTesting = process.env.NODE_ENV === 'development';

  const sidebarLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      requiresAuth: true,
    },
    {
      name: "Access Management",
      href: "/access",
      icon: Users,
      requiresAuth: true,
      requiredPermission: { resource: "access", action: "read" },
    },
    {
      name: "Kubernetes Debug",
      href: "/kubernetes",
      icon: Terminal,
      requiresAuth: true,
      requiredPermission: { resource: "kubernetes", action: "read" },
    },
    {
      name: "Documentation",
      href: "/docs",
      icon: FileText,
      requiresAuth: true,
      requiredPermission: { resource: "documentation", action: "read" },
    },
    {
      name: "Jira",
      href: "/jira",
      icon: Link,
      requiresAuth: true,
      requiredPermission: { resource: "jira", action: "read" },
    },
    {
      name: "Role Management",
      href: "/roles",
      icon: ShieldCheck,
      requiresAuth: true,
      requiredPermission: { resource: "settings", action: "admin" },
    },
    {
      name: "Sandbox Orchestration",
      href: "/sandbox",
      icon: Box,
      requiresAuth: true,
    },
    {
      name: "Release Deployment",
      href: "/release",
      icon: Rocket,
      requiresAuth: true,
    },
  ];

  const bottomLinks = [
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      requiresAuth: true,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      requiresAuth: true,
      requiredPermission: { resource: "settings", action: "read" },
    },
  ];

  const filteredLinks = sidebarLinks.filter(link => {
    if (!link.requiresAuth) return true;
    if (isLocalTesting) return true;
    if (!user.authenticated) return false;
    if (link.requiredPermission) {
      return hasPermission(link.requiredPermission.resource, link.requiredPermission.action);
    }
    return true;
  });

  const filteredBottomLinks = bottomLinks.filter(link => {
    if (!link.requiresAuth) return true;
    if (isLocalTesting) return true;
    if (!user.authenticated) return false;
    if (link.requiredPermission) {
      return hasPermission(link.requiredPermission.resource, link.requiredPermission.action);
    }
    return true;
  });

  return (
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 border-r h-full flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">Cloud Helper</h1>
        <p className="text-xs text-muted-foreground">Infrastructure management assistant</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <nav>
          <ul className="space-y-2">
            {filteredLinks.map((link) => (
              <li key={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-muted-foreground hover:bg-muted",
                    location.pathname === link.href &&
                      "bg-muted text-foreground font-medium"
                  )}
                  onClick={() => navigate(link.href)}
                >
                  <link.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                  {link.name}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="p-3 border-t">
        <ul className="space-y-2">
          {filteredBottomLinks.map((link) => (
            <li key={link.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-muted-foreground hover:bg-muted",
                  location.pathname === link.href &&
                    "bg-muted text-foreground font-medium"
                )}
                onClick={() => navigate(link.href)}
              >
                <link.icon className="h-5 w-5 mr-3 text-muted-foreground" />
                {link.name}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
