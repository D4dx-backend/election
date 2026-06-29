import { Link, useLocation } from "wouter";
import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building,
  Vote,
  Users,
  UserPlus,
  Folder,
  BarChart3,
  FileText,
  Settings,
  History,
  UserCog,
  User,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  userRole?: string;
}

export function Sidebar({ isOpen, userRole = "" }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const isSuperAdmin = userRole === "super_admin";
  const isFranchiseAdmin = userRole === "franchise_admin";
  const isElectionAdmin = userRole === "election_admin";
  const isVoter = userRole === "voter";

  const NavLink = ({
    href,
    icon,
    label,
  }: {
    href: string;
    icon: React.ReactNode;
    label: string;
  }) => {
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

  // ── Voter: single-item menu ──
  if (isVoter) {
    return (
      <aside
        className={cn(
          "sidebar scrollbar-thin fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-slate-200/80 overflow-y-auto z-20 transition-transform duration-300",
          !isOpen && "transform -translate-x-full lg:translate-x-0"
        )}
      >
        <nav className="mt-4 px-4 py-2">
          <NavLink href="/voting" icon={<Vote />} label="Cast Vote" />
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
      <nav className="mt-4 space-y-0.5">

        {/* ── Section: Core (all admin roles) ── */}
        <div className="px-4 py-2">
          <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Overview
          </p>
          <NavLink href="/" icon={<LayoutDashboard />} label="Dashboard" />
        </div>

        {/* ── Super Admin section ── */}
        {isSuperAdmin && (
          <div className="px-4 py-2">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Administration
            </p>
            <NavLink href="/franchises" icon={<Building />} label="Franchises" />
            <NavLink href="/admins" icon={<UserCog />} label="Admins" />
            <NavLink href="/audit-logs" icon={<History />} label="Audit Logs" />
          </div>
        )}

        {/* ── Franchise Admin & Election Admin sections ── */}
        {(isFranchiseAdmin || isElectionAdmin) && (
          <>
            <div className="px-4 py-2">
              <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Elections
              </p>
              <NavLink href="/elections" icon={<Vote />} label="Elections" />
              {isFranchiseAdmin && (
                <NavLink href="/election-groups" icon={<Folder />} label="Election Groups" />
              )}
            </div>

            <div className="px-4 py-2">
              <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                People
              </p>
              <NavLink href="/nominees" icon={<ClipboardList />} label="Nominees" />
              <NavLink href="/voters" icon={<Users />} label="Voters" />
              <NavLink href="/voter-groups" icon={<UserPlus />} label="Voter Groups" />
            </div>

            <div className="px-4 py-2">
              <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Insights
              </p>
              <NavLink href="/analytics" icon={<BarChart3 />} label="Analytics" />
              <NavLink href="/reports" icon={<FileText />} label="Reports" />
            </div>
          </>
        )}

        {/* ── Account (all admin roles) ── */}
        <div className="px-4 py-2">
          <NavLink href="/profile" icon={<User />} label="Profile" />
          <NavLink href="/settings" icon={<Settings />} label="Settings" />
        </div>

      </nav>
    </aside>
  );
}
