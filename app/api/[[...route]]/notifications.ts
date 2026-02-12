import { Hono } from "hono";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const app = new Hono()

  // Get all notifications for the current user
  .get("/", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return c.json(notifications);
  })

  // Mark a notification as read (idempotent with race condition prevention)
  .post("/:id/read", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notificationId = c.req.param("id");

    // Use Prisma's interactive transaction to prevent race conditions
    const result = await prisma.$transaction(
      async (tx) => {
        // First, retrieve the current notification state
        const notification = await tx.notification.findUnique({
          where: {
            id: notificationId,
          },
        });

        if (!notification) {
          return { success: false, code: "NOT_FOUND" as const };
        }

        if (notification.userId !== session.user.id) {
          return { success: false, code: "FORBIDDEN" as const };
        }

        // Check if already read - skip update if so (idempotent)
        if (notification.readAt !== null) {
          console.debug(
            `[Notifications] Skipping update for already-read notification: ${notificationId}`,
          );
          return { success: true, code: "ALREADY_READ" as const };
        }

        // Use atomic update with condition to prevent race conditions
        // This ensures the update only happens if readAt is still null
        const updated = await tx.notification.updateMany({
          where: {
            id: notificationId,
            readAt: null, // Atomic check - only update if still unread
          },
          data: {
            read: true,
            readAt: new Date(),
          },
        });

        // If no rows were updated, another process already marked it as read
        if (updated.count === 0) {
          console.debug(
            `[Notifications] Race condition avoided for notification: ${notificationId}`,
          );
          return { success: true, code: "ALREADY_READ" as const };
        }

        return { success: true, code: "UPDATED" as const };
      },
      {
        // Use Serializable isolation to prevent race conditions
        isolationLevel: "Serializable",
      },
    );

    if (result.code === "NOT_FOUND") {
      return c.json({ error: "Notification not found" }, 404);
    }

    if (result.code === "FORBIDDEN") {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Return success regardless of whether we updated or it was already read
    // This ensures idempotency - calling multiple times is safe
    return c.json({ success: true, status: result.code });
  })

  // Mark all notifications as read
  .post("/read-all", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Use updateMany with read: false condition to only update unread notifications
    // This is already idempotent - calling multiple times has no side effects
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    console.debug(
      `[Notifications] Marked ${result.count} notifications as read for user: ${session.user.id}`,
    );

    return c.json({ success: true, updatedCount: result.count });
  })

  // Get unread notification count
  .get("/unread-count", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        read: false,
      },
    });

    return c.json({ count });
  });

export default app;
