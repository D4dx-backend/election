import { Link, useLocation } from "wouter";
import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Building, 
  Vote, 
  Users, 
  User, 
  Folder, 
  BarChart, 
  FileText,
  Settings,
  History,
  UserPlus
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  userRole?: string;
}

export function Sidebar({ isOpen, userRole = '' }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };
  
  const isSuperAdmin = userRole === 'super_admin';
  const isFranchiseAdmin = userRole === 'franchise_admin';
  const isElectionAdmin = userRole === 'election_admin';
  const isVoter = userRole === 'voter';

  // Create a custom NavLink component. Uses wouter's Link for instant,
  // client-side navigation (no full page reload) — faster on mobile.
  const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={cn(
          "group relative flex items-center gap-3 px-4 py-2.5 my-0.5 rounded-xl text-sm font-medium transition-colors",
          active
            ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-full before:bg-primary"
            : "text-slate-600 hover:bg-primary/5 hover:text-primary"
        )}
      >
        {isValidElement(icon)
          ? cloneElement(icon as ReactElement<{ className?: string }>, {
              className: cn(
                "h-5 w-5 shrink-0 transition-colors",
                active ? "text-primary" : "text-slate-400 group-hover:text-primary"
              ),
            })
          : icon}
        <span>{label}</span>
      </Link>
    );
  };

  // If user is a voter, show a simplified menu
  if (isVoter) {
    return (
      <aside 
        className={cn(
          "sidebar scrollbar-thin fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200/80 overflow-y-auto z-20 transition-transform duration-300",
          !isOpen && "transform -translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="mt-4">
          <div className="px-4 py-2">
            <NavLink 
              href="/voting" 
              icon={<Vote className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Cast Vote" 
            />
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "sidebar scrollbar-thin fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200/80 overflow-y-auto z-20 transition-transform duration-300",
        !isOpen && "transform -translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="mt-4">
        <div className="px-4 py-2">
          <NavLink 
            href="/" 
            icon={<LayoutDashboard className="mr-3 h-5 w-5 text-gray-600" />} 
            label="Dashboard" 
          />
          {/* Super admin keeps a simple top-level menu (franchises + admins); elections are managed by franchise/election admins */}
          {!isSuperAdmin && (
            <NavLink 
              href="/elections" 
              icon={<Vote className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Elections" 
            />
          )}
          {/* Only super admin manages franchises at the top level */}
          {isSuperAdmin && (
            <NavLink
              href="/franchises"
              icon={<Building className="mr-3 h-5 w-5 text-gray-600" />}
              label="Franchises"
            />
          )}
          {/* Voter & election organisation — available to election-running admins */}
          {!isSuperAdmin && (
            <>
              <NavLink
                href="/voters"
                icon={<Users className="mr-3 h-5 w-5 text-gray-600" />}
                label="Voters"
              />
              <NavLink
                href="/voter-groups"
                icon={<UserPlus className="mr-3 h-5 w-5 text-gray-600" />}
                label="Voter Groups"
              />
              <NavLink
                href="/election-groups"
                icon={<Folder className="mr-3 h-5 w-5 text-gray-600" />}
                label="Election Groups"
              />
            </>
          )}
        </div>

        {isSuperAdmin && (
          <div className="px-4 py-2">
            <NavLink 
              href="/audit-logs" 
              icon={<History className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Audit Logs" 
            />
          </div>
        )}

        <div className="px-4 py-2">
          <NavLink 
            href="/settings" 
            icon={<Settings className="mr-3 h-5 w-5 text-gray-600" />} 
            label="Settings" 
          />
        </div>
      </nav>
    </aside>
  );
}
