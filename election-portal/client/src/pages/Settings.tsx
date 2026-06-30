import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AccountShell } from "@/components/account/AccountShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  clearNotificationReadState,
  loadUserPreferences,
  saveUserPreferences,
  UserPreferences,
} from "@/lib/userPreferences";
import {
  Bell,
  Lock,
  LogOut,
  Settings as SettingsIcon,
  Shield,
  SlidersHorizontal,
  User as UserIcon,
} from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadUserPreferences());

  useEffect(() => {
    document.title = "Settings | Vote+";
  }, []);

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/change-password", {
        currentPassword,
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
      setCurrentPassword("");
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

  const handlePasswordSubmit = (e: React.FormEvent) => {
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

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = saveUserPreferences({ [key]: value });
    setPreferences(next);
  };

  const handleDesktopNotifications = async (enabled: boolean) => {
    if (enabled && typeof Notification !== "undefined") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Permission denied",
          description: "Enable notifications in your browser settings to use this feature.",
          variant: "destructive",
        });
        return;
      }
    }
    updatePreference("desktopNotifications", enabled);
    toast({
      title: enabled ? "Desktop notifications enabled" : "Desktop notifications disabled",
      description: enabled
        ? "You will receive browser alerts for important election updates."
        : "Browser alerts are turned off.",
    });
  };

  const handleClearNotificationHistory = () => {
    clearNotificationReadState();
    toast({
      title: "Notification history cleared",
      description: "All notifications will show as unread until you mark them read again.",
      variant: "success",
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userFullName");
    queryClient.clear();
    navigate("/login");
  };

  return (
    <AccountShell title="Settings">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage security, notifications, and app preferences.
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lock className="h-5 w-5 text-primary" />
                  Change password
                </CardTitle>
                <CardDescription>
                  Enter your current password, then choose a new one.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm new password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? "Updating…" : "Update password"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-primary" />
                  Session
                </CardTitle>
                <CardDescription>Sign out of Vote+ on this device.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification preferences
                </CardTitle>
                <CardDescription>
                  Control how Vote+ alerts you about elections and activity.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Email alerts</p>
                    <p className="text-xs text-muted-foreground">
                      Receive email when elections open, close, or results publish.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailAlerts}
                    onCheckedChange={(checked) => updatePreference("emailAlerts", checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Desktop notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Show browser notifications for high-priority election alerts.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.desktopNotifications}
                    onCheckedChange={handleDesktopNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Reset notification read state</p>
                    <p className="text-xs text-muted-foreground">
                      Mark all in-app notifications as unread again.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearNotificationHistory}>
                    Clear history
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                  Display
                </CardTitle>
                <CardDescription>Customize how information appears in the portal.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Compact tables</p>
                    <p className="text-xs text-muted-foreground">
                      Use tighter spacing in voter and election lists.
                    </p>
                  </div>
                  <Switch
                    checked={preferences.compactTables}
                    onCheckedChange={(checked) => updatePreference("compactTables", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserIcon className="h-5 w-5 text-primary" />
                  Account
                </CardTitle>
                <CardDescription>Quick links for your account.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/profile">View profile</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About Vote+</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Election management platform by D4DX.</p>
                <p>Version 1.0</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AccountShell>
  );
}
