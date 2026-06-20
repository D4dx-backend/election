import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VoterLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function VoterLayout({ children, title }: VoterLayoutProps) {
  const [, navigate] = useLocation();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Handle logout
  const handleLogout = () => {
    // Clear all auth-related data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userFullName');
    console.log("Logged out, clearing authToken and user from localStorage");
    
    // Force page reload to clear any in-memory state
    window.location.href = '/login';
  };

  // Get current user info
  const userFullName = localStorage.getItem('userFullName') || 'Voter';

  // Set document title
  useEffect(() => {
    document.title = title ? `${title} | Election Management System` : 'Election Management System';
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-1 min-w-0">
            <h1 
              className="text-lg md:text-xl font-bold cursor-pointer truncate" 
              onClick={() => navigate('/voting')}
            >
              Election Portal
            </h1>
            {title && (
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {title}
              </p>
            )}
          </div>
          
          {/* User Menu - More compact for mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="ml-2">
                <User className="h-4 w-4 mr-1" />
                <span className="max-w-[100px] truncate hidden sm:inline">{userFullName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Voter Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 dark:text-red-400 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Main Content with mobile-friendly padding */}
      <main className="flex-1 pb-16">
        {children}
      </main>
      
      {/* Simplified Footer for mobile */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 fixed bottom-0 w-full">
        <div className="container mx-auto px-4 text-center text-xs text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Election Management System</p>
        </div>
      </footer>
    </div>
  );
}