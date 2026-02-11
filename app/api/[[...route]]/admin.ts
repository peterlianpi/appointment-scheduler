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
// HELPER FUNCTIONS
// ============================================

async function checkIsAdmin(c: Context): Promise<boolean> {
  const cookie = c.req.header("cookie");
  const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};

  // Use Better Auth's session to check admin role
  const session = await auth.api.getSession({ headers });
  if (!session?.user) {
    return false;
  }

  // Check if user has admin role via direct query (Better Auth admin plugin)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
      const cookie = c.req.header("cookie");
      const headers: Record<string, string> = cookie ? { Cookie: cookie } : {};

      const session = await auth.api.getSession({ headers });
      if (!session?.user) {
        return c.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      // Check admin role directly (Better Auth compatible approach)
      const isAdmin = await checkIsAdmin(c);

      return c.json({
        success: true,
        data: { isAdmin } as CheckAdminResponse,
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
      const isAdminUser = await checkIsAdmin(c);
      if (!isAdminUser) {
        return c.json(
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
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
