import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Settings as SettingsIcon, User as UserIcon, Lock } from "lucide-react";

interface CurrentUser {
  id: string;
  username: string;
  role?: string;
  email?: string;
  fullName?: string;
}

function formatRole(role?: string) {
  if (!role) return "—";
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function Settings() {
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    document.title = "Settings | Vote+";
  }, []);

  const { data: user } = useQuery<CurrentUser>({
    queryKey: ["/api/auth/me"],
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not loaded yet.");
      const res = await apiRequest("POST", `/api/users/${user.id}/reset-password`, {
        newPassword,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
        variant: "success",
      });
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err: Error) => {
      toast({
        title: "Could not update password",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        description: "Please re-enter the same password.",
        variant: "destructive",
      });
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account and security.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserIcon className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Your account information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Full Name</Label>
              <p className="text-sm font-medium text-gray-900">{user?.fullName || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Username</Label>
              <p className="text-sm font-medium text-gray-900">{user?.username || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Email</Label>
              <p className="text-sm font-medium text-gray-900">{user?.email || "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Role</Label>
              <p className="text-sm font-medium text-gray-900">{formatRole(user?.role)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-primary" />
              Change Password
            </CardTitle>
            <CardDescription>Update your login password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={changePasswordMutation.isPending}
              >
                {changePasswordMutation.isPending ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
