import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api/hono-client";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

// API response type (dates as strings)
interface NotificationApiResponse {
  id: string;
  title: string;
  description: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  userId: string;
}

function transformNotification(
  data: NotificationApiResponse,
): NotificationItem {
  return {
    ...data,
    readAt: data.readAt ? new Date(data.readAt) : null,
    createdAt: new Date(data.createdAt),
  };
}

export function useNotifications() {
  return useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    staleTime: 30 * 1000, // 30 seconds
    queryFn: async () => {
      const response = await client.api.notifications.$get();
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      const data = (await response.json()) as NotificationApiResponse[];
      return data.map(transformNotification);
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await client.api.notifications[":id"].read.$post({
        param: { id: notificationId },
      });
      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.notifications["read-all"].$post({});
      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    staleTime: 30 * 1000, // 30 seconds
    queryFn: async () => {
      const response = await client.api.notifications["unread-count"].$get();
      if (!response.ok) {
        throw new Error("Failed to fetch unread count");
      }
      const data = await response.json();
      return data as { count: number };
    },
  });
}
