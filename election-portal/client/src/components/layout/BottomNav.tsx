import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Building,
  Vote,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

/**
 * Mobile-first bottom navigation bar.
 * Visible only on small screens (hidden on lg+ where the sidebar takes over).
 * Items are role-specific — maximum 5 to stay uncluttered.
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

  const isSuperAdmin    = role === "super_admin";
  const isFranchiseAdmin = role === "franchise_admin";
  const isElectionAdmin = role === "election_admin";

  const items: BottomNavItem[] = [];

  // ── Super Admin ──
  if (isSuperAdmin) {
    items.push(
      { href: "/",           label: "Home",       icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/franchises", label: "Franchises", icon: <Building        className="h-5 w-5" /> },
      { href: "/admins",     label: "Admins",     icon: <Users           className="h-5 w-5" /> },
      { href: "/settings",   label: "Settings",   icon: <Settings        className="h-5 w-5" /> },
    );
  }

  // ── Franchise Admin ──
  if (isFranchiseAdmin) {
    items.push(
      { href: "/",          label: "Home",      icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/elections", label: "Elections", icon: <Vote            className="h-5 w-5" /> },
      { href: "/voters",    label: "Voters",    icon: <Users           className="h-5 w-5" /> },
      { href: "/analytics", label: "Analytics", icon: <BarChart3       className="h-5 w-5" /> },
      { href: "/settings",  label: "Settings",  icon: <Settings        className="h-5 w-5" /> },
    );
  }

  // ── Election Admin ──
  if (isElectionAdmin) {
    items.push(
      { href: "/",          label: "Home",      icon: <LayoutDashboard className="h-5 w-5" /> },
      { href: "/elections", label: "Elections", icon: <Vote            className="h-5 w-5" /> },
      { href: "/voters",    label: "Voters",    icon: <Users           className="h-5 w-5" /> },
      { href: "/analytics", label: "Analytics", icon: <BarChart3       className="h-5 w-5" /> },
      { href: "/settings",  label: "Settings",  icon: <Settings        className="h-5 w-5" /> },
    );
  }

  // Voters have their own layout (VoterLayout) with its own bottom nav
  const navItems = items.slice(0, 5);
  if (navItems.length === 0) return null;

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
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors active:opacity-60",
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
