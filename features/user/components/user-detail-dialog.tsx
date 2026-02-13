"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  Calendar,
  Shield,
  Ban,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAdminUser } from "@/features/user/api/use-users";

interface UserDetailDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDialog({
  userId,
  open,
  onOpenChange,
}: UserDetailDialogProps) {
  const { data, isLoading, error } = useAdminUser(userId);

  const user = data?.data?.user;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load user details</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-medium">
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {user.name || "Unknown"}
                </h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Role</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {user.role}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Account Status</CardDescription>
                  <CardTitle className="flex items-center gap-2">
                    {user.banned ? (
                      <>
                        <Ban className="h-4 w-4 text-destructive" />
                        Banned
                      </>
                    ) : user.emailVerified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-orange-500" />
                        Unverified
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Member Since
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Email Verified
                    </p>
                    <p className="flex items-center gap-2">
                      {user.emailVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-orange-500" />
                          Not Verified
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {user.banned && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Ban Information
                    </p>
                    <p className="text-destructive">
                      {user.banReason || "Banned by administrator"}
                    </p>
                    {user.banExpires && (
                      <p className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4" />
                        Expires:{" "}
                        {new Date(user.banExpires).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {user._count?.appointments !== undefined && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Statistics</p>
                    <p className="text-lg font-semibold">
                      {user._count.appointments} appointment(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
