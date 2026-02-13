"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  useAdminUser,
  useUpdateAdminUser,
} from "@/features/user/api/use-users";
import type { UpdateUserParams, AdminUser } from "@/features/user/types";

interface UserEditDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Default values for form
const DEFAULT_FORM_STATE = {
  name: "",
  role: "USER",
  banned: false,
  banReason: "",
};

export function UserEditDialog({
  userId,
  open,
  onOpenChange,
}: UserEditDialogProps) {
  const { data, isLoading, error } = useAdminUser(userId);
  const updateUserMutation = useUpdateAdminUser();

  const user: AdminUser | undefined = data?.data?.user;

  // Initialize form state based on user data - only when dialog opens with valid user
  const initialFormState = user
    ? {
        name: user.name ?? "",
        role: user.role ?? "USER",
        banned: !!user.banned,
        banReason: user.banReason ?? "",
      }
    : DEFAULT_FORM_STATE;

  const [name, setName] = useState(initialFormState.name);
  const [role, setRole] = useState(initialFormState.role);
  const [banned, setBanned] = useState(initialFormState.banned);
  const [banReason, setBanReason] = useState(initialFormState.banReason);

  // Reset form when dialog opens with new user data
  if (open && user && name === "" && role === "USER") {
    setName(user.name ?? "");
    setRole(user.role ?? "USER");
    setBanned(!!user.banned);
    setBanReason(user.banReason ?? "");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const updateData: UpdateUserParams = {
        name,
        role,
      };

      // If banning, include ban reason
      if (banned && banReason) {
        updateData.banned = true;
        updateData.banReason = banReason;
      } else if (!banned) {
        updateData.banned = false;
        updateData.banReason = undefined;
      }

      await updateUserMutation.mutateAsync({ userId, data: updateData });
      toast.success("User updated successfully");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update user");
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Failed to load user details</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user name"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ban Toggle */}
            <div className="flex items-center justify-between space-y-2">
              <Label htmlFor="banned" className="flex flex-col gap-1">
                <span>Ban User</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Prevent user from logging in
                </span>
              </Label>
              <Switch
                id="banned"
                checked={banned}
                onCheckedChange={setBanned}
              />
            </div>

            {/* Ban Reason */}
            {banned && (
              <div className="space-y-2">
                <Label htmlFor="banReason">Ban Reason</Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for banning this user"
                  rows={3}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
