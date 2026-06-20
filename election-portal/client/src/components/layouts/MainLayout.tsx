import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import {
  Building2,
  Calendar,
  Home,
  BarChart2,
  Users,
  UserCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Determine if we're on mobile - simple implementation
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    // Force a complete page refresh to clear React state
    window.location.href = "/login";
    
    // Log to console for debugging
    console.log("Logged out, clearing authToken and user from localStorage");
  };

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  // Get user data from localStorage
  const userDataString = localStorage.getItem('user');
  let userData = null;
  try {
    userData = userDataString ? JSON.parse(userDataString) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  const userRole = userData?.role || 'voter';
  const userFullName = userData?.fullName || userData?.username || 'User';
  
  // Define navigation items based on user role
  let navItems = [];
  
  // All admin roles get Dashboard
  if (userRole === 'super_admin' || userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Dashboard",
      path: "/",
      icon: <Home className="h-5 w-5" />,
    });
  }
  
  // Only super_admin can manage franchises
  if (userRole === 'super_admin') {
    navItems.push({
      name: "Franchises",
      path: "/franchises",
      icon: <Building2 className="h-5 w-5" />,
    });
  }
  
  // All admin roles can access elections
  if (userRole === 'super_admin' || userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Elections",
      path: "/elections",
      icon: <Calendar className="h-5 w-5" />,
    });
  }
  
  // Only franchise_admin and election_admin can access election groups
  if (userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Election Groups",
      path: "/election-groups",
      icon: <Calendar className="h-5 w-5" />,
    });
  }
  
  // Only franchise_admin and election_admin can access nominees
  if (userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Nominees",
      path: "/nominees",
      icon: <UserCheck className="h-5 w-5" />,
    });
  }
  
  // Only franchise_admin and election_admin can access voters
  if (userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Voters",
      path: "/voters",
      icon: <Users className="h-5 w-5" />,
    });
  }
  
  // Only franchise_admin and election_admin can access analytics
  if (userRole === 'franchise_admin' || userRole === 'election_admin') {
    navItems.push({
      name: "Analytics",
      path: "/analytics",
      icon: <BarChart2 className="h-5 w-5" />,
    });
  }
  
  // Only super_admin and franchise_admin can manage election admins
  if (userRole === 'super_admin' || userRole === 'franchise_admin') {
    navItems.push({
      name: "Administrators",
      path: "/admins",
      icon: <Users className="h-5 w-5" />,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="flex items-center">
                  <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white">
                    <span className="font-bold text-sm">EM</span>
                  </div>
                  <span className="ml-2 text-lg font-bold text-gray-900">
                    ElectManager
                  </span>
                </Link>
              </div>
            </div>
            <div className="hidden md:flex md:items-center md:justify-end md:flex-1 lg:w-0">
              <div className="mr-4 text-sm">
                <span className="font-medium text-gray-700">{userFullName}</span>
                <span className="block text-xs text-gray-500">{
                  userRole === 'super_admin' ? 'Super Administrator' :
                  userRole === 'franchise_admin' ? 'Franchise Administrator' :
                  userRole === 'election_admin' ? 'Election Administrator' : 'User'
                }</span>
              </div>
              <Button
                variant="ghost"
                className="ml-4 text-gray-500 hover:text-gray-700"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation (Desktop) */}
        <aside className="hidden md:flex md:flex-col md:w-64 md:border-r md:border-gray-200 md:bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 px-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    isActive(item.path)
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <Button
              variant="ghost"
              className="flex-shrink-0 w-full text-gray-500 hover:text-gray-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Mobile menu */}
        {isMobile && mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75">
            <div className="fixed inset-0 flex z-40">
              <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <Button
                    variant="ghost"
                    className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close sidebar</span>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <div className="flex-shrink-0 flex items-center px-4">
                    <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white">
                      <span className="font-bold text-sm">EM</span>
                    </div>
                    <span className="ml-2 text-lg font-bold text-gray-900">
                      ElectManager
                    </span>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navItems.map((item) => (
                      <Link
                        key={item.path}
                        href={item.path}
                        className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                          isActive(item.path)
                            ? "bg-primary text-white"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <Button
                    variant="ghost"
                    className="flex-shrink-0 w-full text-gray-500 hover:text-gray-700 flex items-center"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </div>
              <div className="flex-shrink-0 w-14" aria-hidden="true">
                {/* Force sidebar to shrink to fit close icon */}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}