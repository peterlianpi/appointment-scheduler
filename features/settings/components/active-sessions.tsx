"use client";

import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { Laptop, LogOut, RefreshCw } from "lucide-react";

interface Session {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}

interface ActiveSessionsProps {
  sessions: Session[];
  isLoadingSessions: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSignOutSession: (sessionId: string) => void;
  onSignOutAll: () => void;
}

function formatSessionDate(date: Date | string) {
  const d = new Date(date);
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

function getDeviceInfo(userAgent?: string | null) {
  if (!userAgent) return "Unknown Device";

  // Simple browser detection
  if (userAgent.includes("Chrome")) return "Chrome Browser";
  if (userAgent.includes("Firefox")) return "Firefox Browser";
  if (userAgent.includes("Safari")) return "Safari Browser";
  if (userAgent.includes("Edge")) return "Edge Browser";

  return "Unknown Device";
}

export function ActiveSessions({
  sessions,
  isLoadingSessions,
  isRefreshing,
  onRefresh,
  onSignOutSession,
  onSignOutAll,
}: ActiveSessionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Laptop className="h-5 w-5" />
        <div>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions</CardDescription>
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
            onClick={onRefresh}
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
                  onClick={() => onSignOutSession(session.id)}
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
              <Button variant="outline" className=" justify-start h-11">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="truncate">Sign out of other devices</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of other devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out of all other devices except this one.
                  You will need to log in again on those devices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onRefresh}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className=" justify-start h-11">
                <LogOut className="mr-2 h-4 w-4" />
                <span className="truncate">Sign out of all devices</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sign out of all devices?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will sign you out of all devices including this one. You
                  will need to log in again to access your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onSignOutAll}
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
  );
}
