import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api/hono-client";
import type {
  AdminUsersParams,
  AdminUsersResponse,
  SingleUserResponse,
  UpdateUserParams,
  UpdateUserResponse,
} from "../types";

// ============================================
// Query Keys
// ============================================

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: AdminUsersParams) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ============================================
// Fetch Users (Admin)
// ============================================

export async function fetchAdminUsers(
  params: AdminUsersParams = {},
): Promise<AdminUsersResponse> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.page) query.page = params.page.toString();
  if (params.limit) query.limit = params.limit.toString();
  if (params.status && params.status !== "all") query.status = params.status;

  const response = await client.api.admin.users.$get({ query });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return (await response.json()) as AdminUsersResponse;
}

export function useAdminUsers(params: AdminUsersParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => fetchAdminUsers(params),
  });
}

// ============================================
// Fetch Single User (Admin)
// ============================================

export async function fetchAdminUser(
  userId: string,
): Promise<SingleUserResponse> {
  const response = await client.api.admin.users[":id"].$get({
    param: { id: userId },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return (await response.json()) as SingleUserResponse;
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchAdminUser(userId),
    enabled: !!userId,
  });
}

// ============================================
// Update User (Admin)
// ============================================

export async function updateAdminUser(
  userId: string,
  data: UpdateUserParams,
): Promise<UpdateUserResponse> {
  const response = await client.api.admin.users[":id"].$patch({
    param: { id: userId },
    json: data,
  });

  if (!response.ok) {
    // Clone response to avoid consuming the body twice, then parse as generic JSON
    const errorData = (await response.clone().json()) as unknown as {
      error?: { message?: string; code?: string };
    };
    throw new Error(errorData?.error?.message || "Failed to update user");
  }

  return (await response.json()) as UpdateUserResponse;
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UpdateUserParams;
    }) => updateAdminUser(userId, data),
    onSuccess: (_, { userId }) => {
      // Invalidate user list and specific user cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}

// ============================================
// Delete/Ban User (Admin)
// ============================================

export async function deleteAdminUser(
  userId: string,
): Promise<{ success: boolean; data: { message: string } }> {
  const response = await client.api.admin.users[":id"].$delete({
    param: { id: userId },
  });

  if (!response.ok) {
    // Clone response to avoid consuming the body twice, then parse as generic JSON
    const errorData = (await response.clone().json()) as unknown as {
      error?: { message?: string; code?: string };
    };
    throw new Error(errorData?.error?.message || "Failed to delete user");
  }

  return (await response.json()) as {
    success: boolean;
    data: { message: string };
  };
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: () => {
      // Invalidate user list cache
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

// ============================================
// Toggle User Ban (Admin)
// ============================================

export function useToggleUserBan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      ban,
      banReason,
    }: {
      userId: string;
      ban: boolean;
      banReason?: string;
    }) => updateAdminUser(userId, { banned: ban, banReason }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}

// ============================================
// Change User Role (Admin)
// ============================================

export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateAdminUser(userId, { role }),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}
