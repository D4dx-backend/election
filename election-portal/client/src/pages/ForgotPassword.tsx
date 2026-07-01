import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Lock, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Password reset failed");
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Password updated",
        description: data.message || "You can sign in with your new password.",
        variant: "success",
      });
      navigate("/login");
    },
    onError: (error: Error) => {
      toast({
        title: "Could not reset password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    document.title = "Forgot Password | Vote+";
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }
    resetMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="flex-1 flex flex-col justify-center px-5 max-w-sm mx-auto w-full py-10">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 px-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to sign in
            </Button>
          </Link>

          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Reset password</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter your username, the email on your account, and a new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reset-username">Username</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reset-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-11"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-email">Email on account</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password">New password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reset-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-confirm">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="reset-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-11"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Your account must have an email saved in Profile. Voters without email should ask an administrator to reset their password.
            </p>

            <Button type="submit" className="w-full h-11" disabled={resetMutation.isPending}>
              {resetMutation.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
