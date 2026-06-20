import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
    email?: string;
    fullName?: string;
    franchiseId?: string;
    electionAccess?: string[];
  };
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Create a mutation for login
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        console.log("Attempting login with:", credentials.username);
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(credentials)
        });

        // Log the response status
        console.log("Login response status:", response.status);

        const data = await response.json();
        console.log("Login response:", data);

        if (!response.ok) {
          throw new Error(data.message || "Login failed");
        }

        return data as LoginResponse;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Store auth token in localStorage
      localStorage.setItem("authToken", data.token);

      // Store user info in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      toast({
        title: "Login successful",
        description: `Welcome ${data.user.fullName || data.user.username}`,
      });

      console.log("Login successful, navigating to appropriate page");

      // Redirect based on role
      if (data.user.role === 'voter') {
        window.location.href = '/voting';
      } else if (data.user.role === 'election_admin') {
        window.location.href = '/elections';
      } else {
        // super_admin, franchise_admin → dashboard
        window.location.href = '/';
      }
    },
    onError: (error: any) => {
      console.error("Login error in mutation handler:", error);
      let errorMessage = "Invalid username or password";

      // Try to extract error message
      if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    loginMutation.mutate({ username, password });
  };

  useEffect(() => {
    document.title = "Login | ElectManager";

    // Check if user is already logged in
    const token = localStorage.getItem("authToken");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        const userData = JSON.parse(user);

        // Redirect based on role
        if (userData.role === "super_admin" || userData.role === "franchise_admin") {
          navigate("/");
        } else if (userData.role === "election_admin") {
          navigate("/elections");
        } else {
          navigate("/voting");
        }
      } catch (error) {
        // If JSON parsing fails, clear localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
      }
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white mb-4">
            <span className="font-bold text-xl">EM</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ElectManager</h1>
          <p className="text-gray-600 mt-2">Comprehensive Election Management System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loginMutation.isPending}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="text-center mt-4 text-sm text-gray-500">
          <p>For this system, use username: <strong>admin</strong> and password: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
}