"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell,
  User,
  Calendar,
  Mail,
  Shield,
  Lock,
  Laptop,
  LogOut,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useSession } from "@/lib/auth-client";
import { useSessions } from "@/features/auth/hooks/use-sessions";
import {
  useUserPreferences,
  useUpdatePreferences,
  REMINDER_TIME_OPTIONS,
} from "@/features/preferences/api/use-preferences";

export default function SettingsPage() {
  const { data: session, isPending: isLoadingSession } = useSession();
  const {
    sessions,
    isLoading: isLoadingSessions,
    refreshSessions,
    signOutSession,
    signOutAllDevices,
  } = useSessions();

  const { data: preferences, isLoading: isLoadingPrefs } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localPrefs, setLocalPrefs] = useState({
    reminderEnabled: true,
    reminderHoursBefore: 24,
    emailReminders: true,
    inAppReminders: true,
    appointmentCreatedNotif: true,
    appointmentRescheduledNotif: true,
    appointmentCancelledNotif: true,
  });

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs((prev) => ({
        ...prev,
        ...preferences,
      }));
    }
  }, [preferences]);

  const handlePreferenceChange = (key: string, value: boolean | number) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences.mutateAsync(localPrefs);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSessions();
    setIsRefreshing(false);
  };

  const handleSignOutAll = async () => {
    const success = await signOutAllDevices();
    if (success) {
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  const formatSessionDate = (date: Date | string) => {
    const d = new Date(date);
    return format(d, "MMM d, yyyy 'at' h:mm a");
  };

  // Extract user data from session
  const user = session?.user;
  const userName = user?.name || "";
  const userEmail = user?.email || "";
  const firstName = userName.split(" ").slice(0, -1).join(" ") || "";
  const lastName = userName.split(" ").slice(-1).join(" ") || "";

  const getDeviceInfo = (userAgent?: string | null) => {
    if (!userAgent) return "Unknown Device";

    // Simple browser detection
    if (userAgent.includes("Chrome")) return "Chrome Browser";
    if (userAgent.includes("Firefox")) return "Firefox Browser";
    if (userAgent.includes("Safari")) return "Safari Browser";
    if (userAgent.includes("Edge")) return "Edge Browser";

    return "Unknown Device";
  };
  return (
    <div className="p-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator />

        {/* Profile Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <User className="h-5 w-5" />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  defaultValue={firstName}
                  disabled={isLoadingSession}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  defaultValue={lastName}
                  disabled={isLoadingSession}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                defaultValue={userEmail}
                disabled={isLoadingSession}
              />
            </div>
            <Button disabled={isLoadingSession}>
              {isLoadingSession ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Shield className="h-5 w-5" />
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password</Label>
                <p className="text-sm text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/settings/change-password">
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Laptop className="h-5 w-5" />
            <div>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>
                Manage your active login sessions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label>Current Sessions</Label>
                <p className="text-sm text-muted-foreground">
                  {isLoadingSessions
                    ? "Loading..."
                    : `${sessions.length} active session${sessions.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full sm:w-auto h-10"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span className="sm:hidden">Refresh</span>
              </Button>
            </div>

            {sessions.length > 0 && (
              <div className="space-y-3">
                {sessions.slice(0, 5).map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-3"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <Laptop className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getDeviceInfo(session.userAgent)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {session.ipAddress || "Unknown IP"} •{" "}
                          {formatSessionDate(session.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => signOutSession(session.id)}
                      disabled={isLoadingSessions}
                      className="sm:flex-shrink-0 w-full sm:w-auto h-10 sm:h-9"
                    >
                      <LogOut className="h-4 w-4 mr-2 sm:mr-0 sm:hidden" />
                      <span className="sm:hidden">Sign Out</span>
                      <LogOut className="h-4 w-4 hidden sm:block" />
                    </Button>
                  </div>
                ))}
                {sessions.length > 5 && (
                  <p className="text-sm text-muted-foreground">
                    And {sessions.length - 5} more...
                  </p>
                )}
              </div>
            )}

            <Separator />

            <div className="flex flex-col sm:flex-row gap-3">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className=" justify-start h-11"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="truncate">Sign out of other devices</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Sign out of other devices?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out of all other devices except this
                      one. You will need to log in again on those devices.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRefresh}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className=" justify-start h-11"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="truncate">Sign out of all devices</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Sign out of all devices?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will sign you out of all devices including this one.
                      You will need to log in again to access your account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOutAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign out all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Bell className="h-5 w-5" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive appointment reminders via email
                </p>
              </div>
              <Switch
                checked={localPrefs.emailReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("emailReminders", checked)
                }
                disabled={isLoadingPrefs}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Browser Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Show push notifications in your browser
                </p>
              </div>
              <Switch
                checked={localPrefs.inAppReminders}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("inAppReminders", checked)
                }
                disabled={isLoadingPrefs}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Appointment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get reminded before scheduled appointments
                </p>
              </div>
              <Switch
                checked={localPrefs.reminderEnabled}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("reminderEnabled", checked)
                }
                disabled={isLoadingPrefs}
              />
            </div>
            {localPrefs.reminderEnabled && (
              <div className="space-y-2">
                <Label htmlFor="reminderTime">Remind me before</Label>
                <NativeSelect
                  id="reminderTime"
                  value={localPrefs.reminderHoursBefore.toString()}
                  onChange={(e) =>
                    handlePreferenceChange(
                      "reminderHoursBefore",
                      parseInt(e.target.value),
                    )
                  }
                  disabled={isLoadingPrefs}
                >
                  {REMINDER_TIME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <Button
              onClick={handleSavePreferences}
              disabled={isLoadingPrefs || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notification Settings"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Appointment Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Calendar className="h-5 w-5" />
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                Default settings for new appointments
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultDuration">
                Default Duration (minutes)
              </Label>
              <Input id="defaultDuration" type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bufferTime">
                Buffer Between Appointments (minutes)
              </Label>
              <Input id="bufferTime" type="number" defaultValue="5" />
            </div>
            <Button>Save Appointment Settings</Button>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3">
            <Mail className="h-5 w-5" />
            <div>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>
                Customize email content and frequency
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Confirmation Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email when appointment is confirmed
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cancellation Emails</Label>
                <p className="text-sm text-muted-foreground">
                  Receive email when appointment is cancelled
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Weekly Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Get a weekly summary of your appointments
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="w-full sm:w-auto h-11">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
