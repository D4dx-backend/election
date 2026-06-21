import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building,
  Vote,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Mobile-first bottom navigation bar.
 * Visible only on small screens (hidden on lg and up where the sidebar is used).
 * Navigation items adapt to the logged-in user's role.
 */
export function BottomNav() {
  const [location] = useLocation();

  // Read role from localStorage (set at login time)
  let role = "voter";
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && parsed.role) {
        role = parsed.role;
      }
    }
  } catch {
    // ignore parse errors and fall back to default role
  }

  const isSuperAdmin = role === "super_admin";
  const isFranchiseAdmin = role === "franchise_admin";
  const isElectionAdmin = role === "election_admin";

  const items: BottomNavItem[] = [];

  // Dashboard for all admin roles
  if (isSuperAdmin || isFranchiseAdmin || isElectionAdmin) {
    items.push({
      href: "/",
      label: "Home",
      icon: <LayoutDashboard className="h-5 w-5" />,
    });
  }

  // Franchises only for super admin
  if (isSuperAdmin) {
    items.push({
      href: "/franchises",
      label: "Franchises",
      icon: <Building className="h-5 w-5" />,
    });
  }

  // Elections for franchise/election admins (super admin manages franchises, not elections directly)
  if (isFranchiseAdmin || isElectionAdmin) {
    items.push({
      href: "/elections",
      label: "Elections",
      icon: <Vote className="h-5 w-5" />,
    });
  }

  // Settings for every admin role
  if (isSuperAdmin || isFranchiseAdmin || isElectionAdmin) {
    items.push({
      href: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
    });
  }

  // Keep the bar uncluttered on mobile: cap at 5 items
  const navItems = items.slice(0, 5);

  if (navItems.length === 0) {
    return null;
  }

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 shadow-[0_-1px_3px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-gray-500 hover:text-gray-700"
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
