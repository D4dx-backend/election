import { useLocation } from "wouter";
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
  UserCog,
  Settings,
  History,
  ShieldCheck,
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

  // Create a custom NavLink component to avoid nesting <a> tags
  const NavLink = ({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) => {
    return (
      <a 
        href={href}
        className={cn(
          "flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors",
          isActive(href) && "bg-primary bg-opacity-10 border-l-3 border-primary"
        )}
      >
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </a>
    );
  };

  // If user is a voter, show a simplified menu
  if (isVoter) {
    return (
      <aside 
        className={cn(
          "sidebar fixed top-16 left-0 bottom-0 w-64 bg-white shadow-md overflow-y-auto z-20 transition-transform duration-300",
          !isOpen && "transform -translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="mt-4">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Voting</p>
            <NavLink 
              href="/voting-interface" 
              icon={<Vote className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Cast Vote" 
            />
            <NavLink 
              href="/voting-history" 
              icon={<History className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Voting History" 
            />
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside 
      className={cn(
        "sidebar fixed top-16 left-0 bottom-0 w-64 bg-white shadow-md overflow-y-auto z-20 transition-transform duration-300",
        !isOpen && "transform -translate-x-full lg:translate-x-0"
      )}
    >
      <nav className="mt-4">
        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Main</p>
          <NavLink 
            href="/" 
            icon={<LayoutDashboard className="mr-3 h-5 w-5 text-gray-600" />} 
            label="Dashboard" 
          />
          {/* Only show Franchises for super admin */}
          {isSuperAdmin && (
            <NavLink 
              href="/franchises" 
              icon={<Building className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Franchises" 
            />
          )}
        </div>

        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Election Management</p>
          <NavLink 
            href="/elections" 
            icon={<Vote className="mr-3 h-5 w-5 text-gray-600" />} 
            label="Elections" 
          />
          {!isElectionAdmin && (
            <NavLink 
              href="/nominees" 
              icon={<Users className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Nominees" 
            />
          )}
          {(isSuperAdmin || isFranchiseAdmin) && (
            <NavLink 
              href="/voters" 
              icon={<User className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Voters" 
            />
          )}
          {(isSuperAdmin || isFranchiseAdmin) && (
            <NavLink 
              href="/election-groups" 
              icon={<Folder className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Election Groups" 
            />
          )}
        </div>

        <div className="px-4 py-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Results</p>
          <NavLink 
            href="/analytics" 
            icon={<BarChart className="mr-3 h-5 w-5 text-gray-600" />} 
            label="Analytics" 
          />
          {(isSuperAdmin || isFranchiseAdmin) && (
            <NavLink 
              href="/reports" 
              icon={<FileText className="mr-3 h-5 w-5 text-gray-600" />} 
              label="Reports" 
            />
          )}
        </div>

        {/* Administration section only for super and franchise admins */}
        {(isSuperAdmin || isFranchiseAdmin) && (
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Administration</p>
            {isSuperAdmin && (
              <NavLink 
                href="/admins" 
                icon={<ShieldCheck className="mr-3 h-5 w-5 text-gray-600" />} 
                label="Administrators" 
              />
            )}
            {isFranchiseAdmin && (
              <NavLink 
                href="/voter-groups" 
                icon={<UserPlus className="mr-3 h-5 w-5 text-gray-600" />} 
                label="Voter Groups" 
              />
            )}
            {isSuperAdmin && (
              <NavLink 
                href="/settings" 
                icon={<Settings className="mr-3 h-5 w-5 text-gray-600" />} 
                label="Settings" 
              />
            )}
            {isSuperAdmin && (
              <NavLink 
                href="/audit-logs" 
                icon={<History className="mr-3 h-5 w-5 text-gray-600" />} 
                label="Audit Logs" 
              />
            )}
          </div>
        )}
      </nav>
    </aside>
  );
}
