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
    // Early validation: Optimistically update the notification status
    // This prevents redundant API calls by updating the cache immediately
    onMutate: async (notificationId: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notifications", "unread-count"] });

      // Snapshot the previous value
      const previousNotifications =
        queryClient.getQueryData<NotificationItem[]>(["notifications"]);
      const previousUnreadCount = queryClient.getQueryData<{ count: number }>([
        "notifications",
        "unread-count",
      ]);

      // Optimistically update to marked as read
      queryClient.setQueryData<NotificationItem[]>(["notifications"], (old) => {
        if (!old) return old;
        return old.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true, readAt: new Date() }
            : notification,
        );
      });

      // Optimistically decrement unread count
      if (previousUnreadCount) {
        queryClient.setQueryData<{ count: number }>(
          ["notifications", "unread-count"],
          {
            count: Math.max(0, previousUnreadCount.count - 1),
          },
        );
      }

      return {
        previousNotifications,
        previousUnreadCount,
      };
    },
    // Rollback on error
    onError: (_error, _notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications,
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousUnreadCount,
        );
      }
    },
    // Always refetch after error or success to ensure consistency
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
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
    // Optimistically update all unread notifications to read
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      await queryClient.cancelQueries({ queryKey: ["notifications", "unread-count"] });

      const previousNotifications =
        queryClient.getQueryData<NotificationItem[]>(["notifications"]);
      const previousUnreadCount = queryClient.getQueryData<{ count: number }>([
        "notifications",
        "unread-count",
      ]);

      // Mark all as read
      queryClient.setQueryData<NotificationItem[]>(["notifications"], (old) => {
        if (!old) return old;
        const now = new Date();
        return old.map((notification) =>
          notification.read
            ? notification
            : { ...notification, read: true, readAt: now },
        );
      });

      // Set unread count to 0
      queryClient.setQueryData<{ count: number }>(
        ["notifications", "unread-count"],
        { count: 0 },
      );

      return {
        previousNotifications,
        previousUnreadCount,
      };
    },
    onError: (_error, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          ["notifications"],
          context.previousNotifications,
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          ["notifications", "unread-count"],
          context.previousUnreadCount,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
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
