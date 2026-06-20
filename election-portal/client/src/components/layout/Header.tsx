import { UserCircle, Bell, Menu, ChevronDown, LogOut, UserCog, User, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

interface HeaderProps {
  toggleSidebar: () => void;
  user: {
    name: string;
    role: string;
    displayRole?: string;
    avatar?: string;
  };
}

export function Header({ toggleSidebar, user }: HeaderProps) {
  const [, navigate] = useLocation();
  
  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    
    // Force a complete page refresh to clear React state
    window.location.href = "/login";
    
    // Log to console for debugging
    console.log("Logged out, clearing authToken and user from localStorage");
  };

  // Handle navigation to help/onboarding page
  const handleHelpClick = () => {
    navigate("/onboarding");
  };

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-30">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden mr-2" 
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="font-bold">EM</span>
            </div>
            <span className="ml-2 text-xl font-semibold text-primary">ElectManager</span>
          </div>
        </div>

        <div className="flex items-center">
          {/* Help button */}
          <div className="relative mr-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative text-primary hover:text-primary-dark"
              onClick={handleHelpClick}
              title="Help & Tutorials"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Notifications */}
          <div className="relative mr-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
            </Button>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-md">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex md:flex-col md:items-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge variant="outline" className="px-1 py-0 text-xs h-5 bg-slate-100">
                    <Shield className="h-3 w-3 mr-1" />
                    {user.displayRole || user.role}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs text-muted-foreground pt-0">
                {user.displayRole || user.role}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserCog className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleHelpClick}>
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Tutorial
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
