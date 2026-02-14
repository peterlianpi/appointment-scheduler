"use client";

import * as React from "react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/features/notifications/api/use-notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatTime, formatReadAt } from "@/lib/utils";

export function NotificationList() {
  const { data: notifications, isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  // Track which notifications are being marked as read for visual feedback
  const [markingReadIds, setMarkingReadIds] = React.useState<Set<string>>(
    new Set(),
  );

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleMarkAsRead = (id: string) => {
    setMarkingReadIds((prev) => new Set(prev).add(id));
    markAsRead.mutate(id, {
      onSettled: () => {
        setMarkingReadIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      },
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            You have {unreadCount} unread notification
            {unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-2" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start justify-between gap-4 p-4 rounded-lg transition-all cursor-pointer ${
                      !notification.read ? "bg-muted/50" : "opacity-70"
                    } ${
                      markingReadIds.has(notification.id)
                        ? "ring-2 ring-primary/20"
                        : ""
                    } ${notification.read ? "hover:opacity-100" : ""}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!notification.read) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (!notification.read) {
                          handleMarkAsRead(notification.id);
                        }
                      }
                    }}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {notification.title}
                        </span>
                        {!notification.read && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                        {notification.read && (
                          <span className="text-xs text-muted-foreground">
                            Read
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          Created: {formatTime(notification.createdAt)}
                        </span>
                        {notification.readAt && (
                          <span className="text-green-600">
                            Read at: {formatReadAt(notification.readAt)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read ? (
                        <span
                          className={`text-xs text-muted-foreground ${
                            markingReadIds.has(notification.id)
                              ? "animate-pulse"
                              : ""
                          }`}
                        >
                          {markingReadIds.has(notification.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Click to mark read"
                          )}
                        </span>
                      ) : (
                        <CheckCheck className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
