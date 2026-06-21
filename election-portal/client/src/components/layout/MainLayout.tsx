import { ReactNode, useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Mobile-first: sidebar starts closed on mobile (the bottom nav is the
  // primary navigation there). On large screens the sidebar is always visible.
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-[#F6F8FB]">
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

      {/* Backdrop shown when the sidebar drawer is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/40 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className={cn(
        "py-6 px-4 sm:px-6 lg:px-8 min-h-screen transition-padding duration-300",
        "pt-20", // Account for fixed header
        "pb-24 lg:pb-6", // Account for the mobile bottom navigation
        "lg:pl-72" // Always leave room for the fixed sidebar on large screens
      )}>
        {children}

        <footer className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
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
      <BottomNav />
    </div>
  );
}
