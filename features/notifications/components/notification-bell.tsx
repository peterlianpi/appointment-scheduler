"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationItem,
} from "@/features/notifications/api/use-notifications";

export function NotificationBell() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const [pendingReadIds, setPendingReadIds] = React.useState<Set<string>>(
    new Set(),
  );

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleNotificationClick = async (
    e: React.MouseEvent,
    notification: NotificationItem,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if already read - skip processing for idempotency
    if (notification.read) {
      navigateToNotification(notification);
      return;
    }

    // Check if already pending - prevent duplicate clicks
    if (pendingReadIds.has(notification.id)) {
      return;
    }

    setPendingReadIds((prev) => new Set(prev).add(notification.id));

    try {
      await markAsRead.mutateAsync(notification.id);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      toast.error("Failed to update notification");
    } finally {
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(notification.id);
        return next;
      });
    }

    navigateToNotification(notification);
  };

  const navigateToNotification = (notification: NotificationItem) => {
    if (notification.entityType === "appointment" && notification.entityId) {
      router.push(`/appointments/${notification.entityId}`);
    } else {
      router.push("/dashboard/notifications");
    }
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    markAllAsRead.mutate();
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return d.toLocaleDateString();
  };

  const formatReadAt = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={(e) => handleMarkAllAsRead(e)}
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            Loading...
          </DropdownMenuItem>
        ) : !notifications || notifications.length === 0 ? (
          <DropdownMenuItem className="text-center text-muted-foreground">
            No notifications
          </DropdownMenuItem>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={`flex flex-col items-start gap-1 p-3 ${
                !notification.read ? "bg-muted/50" : ""
              } cursor-pointer`}
              onClick={(e) => handleNotificationClick(e, notification)}
              disabled={pendingReadIds.has(notification.id)}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium">{notification.title}</span>
                {!notification.read && (
                  <Badge className="h-2 w-2 p-0 bg-blue-500 border-0" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {notification.description}
              </span>
              <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(notification.createdAt)}</span>
                {notification.readAt && (
                  <span className="opacity-60">
                    Read {formatReadAt(notification.readAt)}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center text-primary cursor-pointer"
          onClick={() => router.push("/dashboard/notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
