import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { LogOut, User, Vote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  const [location] = useLocation();

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
    document.title = title ? `${title} | Vote+` : 'Vote+';
  }, [title]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Mobile-optimized Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Vote+"
              className="h-10 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/voting')}
            />
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
      <main className="flex-1 pb-20">
        {children}

        <footer className="mt-8 px-4 py-4 text-center text-xs text-gray-400">
          Powered by{" "}
          <a
            href="https://d4dx.co"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            D4DX.CO
          </a>
        </footer>
      </main>

      {/* Mobile-first bottom navigation */}
      <nav
        className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 inset-x-0 z-40 shadow-[0_-1px_3px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch justify-around">
          <li className="flex-1">
            <button
              type="button"
              onClick={() => navigate('/voting')}
              className={cn(
                "w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                location.startsWith('/voting') || location.startsWith('/election/')
                  ? "text-primary"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              )}
            >
              <Vote className="h-5 w-5" />
              <span className="leading-none">Vote</span>
            </button>
          </li>
          <li className="flex-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="leading-none">Logout</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}