import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: "Loading...",
    role: "",
    fullName: "",
    email: ""
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  // Load user data from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        
        // Create a user-friendly display name
        const displayName = parsedUser.fullName || parsedUser.username || "User";
        
        // Format role for display (convert snake_case to Title Case)
        const formattedRole = parsedUser.role 
          ? parsedUser.role
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          : "";
        
        setCurrentUser({
          name: displayName,
          role: parsedUser.role || "",
          fullName: parsedUser.fullName || parsedUser.username || "",
          email: parsedUser.email || ""
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        toggleSidebar={toggleSidebar} 
        user={{
          name: currentUser.name,
          role: currentUser.role,
          displayRole: currentUser.role
            ? currentUser.role
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
            : ""
        }} 
      />
      <Sidebar isOpen={sidebarOpen} userRole={currentUser.role} />
      <main className={cn(
        "py-6 px-4 sm:px-6 lg:px-8 min-h-screen transition-padding duration-300",
        "pt-20", // Account for fixed header
        sidebarOpen ? "lg:pl-72" : "lg:pl-8" // Adjust padding when sidebar is open/closed
      )}>
        {children}
      </main>
    </div>
  );
}
