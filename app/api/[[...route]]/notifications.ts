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

  // Mark a notification as read
  .post("/:id/read", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const notificationId = c.req.param("id");

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    });

    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    if (notification.userId !== session.user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return c.json({ success: true });
  })

  // Mark all notifications as read
  .post("/read-all", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return c.json({ success: true });
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
