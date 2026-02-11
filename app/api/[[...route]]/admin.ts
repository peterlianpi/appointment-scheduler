import { z } from "zod";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hono, type Context } from "hono";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AdminStats {
  totalUsers: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
}

export interface CheckAdminResponse {
  isAdmin: boolean;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getSessionUser(c: Context) {
  const cookie = c.req.header("cookie");
  const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, email: true, name: true },
  });

  return user;
}

async function isAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// ============================================
// ADMIN ROUTER
// ============================================

const app = new Hono()
  // ============================================
  // GET /api/admin/check-admin - Check if current user is admin
  // ============================================
  .get("/check-admin", async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return c.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const isAdminUser = await isAdmin(sessionUser.id);
      return c.json({
        success: true,
        data: { isAdmin: isAdminUser } as CheckAdminResponse,
      });
    } catch (error) {
      console.error("Check admin error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to check admin status",
          },
        },
        500,
      );
    }
  })
  // ============================================
  // GET /api/admin/stats - Get admin dashboard stats
  // ============================================
  .get("/stats", async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return c.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const isAdminUser = await isAdmin(sessionUser.id);
      if (!isAdminUser) {
        return c.json(
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Admin access required" },
          },
          403,
        );
      }

      const [
        totalUsers,
        totalAppointments,
        upcomingAppointments,
        completedAppointments,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.appointment.count(),
        prisma.appointment.count({
          where: {
            status: "SCHEDULED",
            startDateTime: { gte: new Date() },
          },
        }),
        prisma.appointment.count({
          where: { status: "COMPLETED" },
        }),
      ]);

      return c.json({
        success: true,
        data: {
          totalUsers,
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
        } as AdminStats,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to fetch admin stats",
          },
        },
        500,
      );
    }
  });

export default app;

export type AppType = typeof app;
