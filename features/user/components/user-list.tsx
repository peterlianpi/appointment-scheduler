"use client";

import { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MoreHorizontal,
  Shield,
  Mail,
  Calendar,
  Ban,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useAdminUsers,
  useChangeUserRole,
  useToggleUserBan,
  useDeleteAdminUser,
} from "@/features/user/api/use-users";
import type { AdminUser, UserStatusFilter } from "@/features/user/types";
import { UserDetailDialog } from "./user-detail-dialog";
import { UserEditDialog } from "./user-edit-dialog";

interface UserListProps {
  initialSearch?: string;
  initialPage?: number;
  limit?: number;
}

export function UserList({
  initialSearch = "",
  initialPage = 1,
  limit = 10,
}: UserListProps) {
  const [search, setSearch] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<UserStatusFilter>("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminUsers({
    search: search || undefined,
    page,
    limit,
    status,
  });

  const changeRoleMutation = useChangeUserRole();
  const toggleBanMutation = useToggleUserBan();
  const deleteUserMutation = useDeleteAdminUser();

  const users = data?.data?.users ?? [];
  const meta = data?.data?.meta;

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await changeRoleMutation.mutateAsync({ userId, role: newRole });
    } catch (err) {
      console.error("Failed to change role:", err);
    }
  };

  const handleToggleBan = async (userId: string, currentlyBanned: boolean) => {
    try {
      await toggleBanMutation.mutateAsync({
        userId,
        ban: !currentlyBanned,
        banReason: currentlyBanned ? undefined : "Banned by admin",
      });
    } catch (err) {
      console.error("Failed to toggle ban:", err);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (err) {
      console.error("Failed to delete user:", err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Failed to load users</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Users Management
          </h2>
          <p className="text-muted-foreground">Manage all registered users</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-fit">
                <Shield className="h-4 w-4 mr-2" />
                {status === "all" && "All Users"}
                {status === "active" && "Active"}
                {status === "banned" && "Banned"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setStatus("all");
                  setPage(1);
                }}
              >
                All Users
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatus("active");
                  setPage(1);
                }}
              >
                Active
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatus("banned");
                  setPage(1);
                }}
              >
                <Ban className="h-4 w-4 mr-2" />
                Banned
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <div className="p-1">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-62.5" />
                    <Skeleton className="h-4 w-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Appointments</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user: AdminUser) => (
                      <TableRow
                        key={user.id}
                        className={
                          user.banned
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : undefined
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {user.name?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {user.name || "Unknown"}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "ADMIN" ? "default" : "secondary"
                            }
                            className="flex items-center gap-1 w-fit"
                          >
                            <Shield className="h-3 w-3" />
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.banned ? (
                            <Badge
                              variant="destructive"
                              className="flex items-center gap-1 w-fit"
                            >
                              <Ban className="h-3 w-3" />
                              Banned
                            </Badge>
                          ) : user.emailVerified ? (
                            <Badge variant="outline" className="w-fit">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="w-fit">
                              Unverified
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {user._count?.appointments || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedUserId(user.id)}
                              >
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setEditingUserId(user.id)}
                              >
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.role !== "ADMIN" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleRoleChange(
                                        user.id,
                                        user.role === "USER" ? "ADMIN" : "USER",
                                      )
                                    }
                                  >
                                    {user.role === "USER"
                                      ? "Make Admin"
                                      : "Remove Admin"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleBan(user.id, !!user.banned)
                                    }
                                    className={
                                      user.banned ? "" : "text-orange-600"
                                    }
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    {user.banned ? "Unban User" : "Ban User"}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete User
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, meta.total)} of {meta.total} users
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= meta.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-muted-foreground">
                {search
                  ? "Try adjusting your search"
                  : "No users have registered yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {selectedUserId && (
        <UserDetailDialog
          userId={selectedUserId}
          open={!!selectedUserId}
          onOpenChange={(open) => !open && setSelectedUserId(null)}
        />
      )}
      {editingUserId && (
        <UserEditDialog
          userId={editingUserId}
          open={!!editingUserId}
          onOpenChange={(open) => !open && setEditingUserId(null)}
        />
      )}
    </div>
  );
}
