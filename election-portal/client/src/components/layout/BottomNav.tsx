import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building,
  Vote,
  Users,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive?: (location: string) => boolean;
}

function isElectionSectionPath(path: string) {
  return (
    path === "/elections" ||
    path.startsWith("/elections/") ||
    path === "/reports"
  );
}

function isVoterGroupsSectionPath(path: string) {
  return path === "/voters" || path.startsWith("/voters");
}

/**
 * Mobile bottom navigation — hidden on desktop (lg+).
 */
export function BottomNav() {
  const [location] = useLocation();

  let role = "voter";
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.role) role = parsed.role;
    }
  } catch {
    // ignore parse errors — fall back to "voter"
  }

  const isSuperAdmin = role === "super_admin";
  const isFranchiseAdmin = role === "franchise_admin";
  const isElectionAdmin = role === "election_admin";

  const items: BottomNavItem[] = [];

  if (isSuperAdmin) {
    items.push(
      { href: "/", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/franchises", label: "Franchises", icon: <Building className="h-5 w-5" /> },
      { href: "/admins", label: "Admins", icon: <Users className="h-5 w-5" /> },
    );
  }

  if (isFranchiseAdmin || isElectionAdmin) {
    items.push(
      { href: "/", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
      {
        href: "/elections",
        label: "Elections",
        icon: <Vote className="h-5 w-5" />,
        isActive: (path) => isElectionSectionPath(path),
      },
      {
        href: "/voters",
        label: "Groups",
        icon: <UserPlus className="h-5 w-5" />,
        isActive: (path) => isVoterGroupsSectionPath(path),
      },
    );
  }

  const navItems = items.slice(0, 5);
  if (navItems.length === 0) return null;

  const isActive = (item: BottomNavItem) =>
    item.isActive
      ? item.isActive(location)
      : item.href === "/"
        ? location === "/" || location === "/dashboard"
        : location === item.href || location.startsWith(`${item.href}/`);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-1px_6px_rgba(0,0,0,0.06)] mobile-bottom-nav"
      aria-label="Primary navigation"
    >
      <ul className="flex h-14 items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:opacity-60",
                  active ? "text-primary" : "text-gray-500 hover:text-gray-700"
                )}
              >
                <span className={cn(active && "text-primary")}>{item.icon}</span>
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default BottomNav;
