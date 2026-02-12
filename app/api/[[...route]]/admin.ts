import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { sendAppointmentReminder } from "@/features/mail/lib/appointment";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface AdminStats {
  totalUsers: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface CheckAdminResponse {
  isAdmin: boolean;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const adminExportQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

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
        cancelledAppointments,
        noShowAppointments,
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
        prisma.appointment.count({
          where: { status: "CANCELLED" },
        }),
        prisma.appointment.count({
          where: { status: "NO_SHOW" },
        }),
      ]);

      // Calculate rates
      const nonDeletedAppointments = totalAppointments; // Using total as base
      const completionRate =
        nonDeletedAppointments > 0
          ? (completedAppointments / nonDeletedAppointments) * 100
          : 0;
      const cancellationRate =
        nonDeletedAppointments > 0
          ? (cancelledAppointments / nonDeletedAppointments) * 100
          : 0;
      const noShowRate =
        nonDeletedAppointments > 0
          ? (noShowAppointments / nonDeletedAppointments) * 100
          : 0;

      return c.json({
        success: true,
        data: {
          totalUsers,
          totalAppointments,
          upcomingAppointments,
          completedAppointments,
          cancelledAppointments,
          noShowAppointments,
          completionRate: Math.round(completionRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          noShowRate: Math.round(noShowRate * 100) / 100,
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
  })
  // ============================================
  // GET /api/admin/export-appointments - Export all appointments (Admin only)
  // ============================================
  .get(
    "/export-appointments",
    zValidator("query", adminExportQuerySchema),
    async (c) => {
      try {
        const isAdminUser = await checkIsAdmin(c);
        if (!isAdminUser) {
          return c.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
            },
            401,
          );
        }

        const { startDate, endDate, status, format } = c.req.valid("query");

        const where: Record<string, unknown> = {
          deletedAt: null,
        };

        if (startDate || endDate) {
          where.startDateTime = {};
          if (startDate)
            (where.startDateTime as Record<string, Date>).gte = new Date(
              startDate,
            );
          if (endDate)
            (where.startDateTime as Record<string, Date>).lte = new Date(
              endDate,
            );
        }

        if (status) {
          where.status = status;
        }

        const appointments = await prisma.appointment.findMany({
          where,
          orderBy: { startDateTime: "desc" },
          select: {
            id: true,
            title: true,
            description: true,
            startDateTime: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        // Format appointment data for export
        const exportData = appointments.map((apt) => ({
          id: apt.id,
          title: apt.title,
          description: apt.description || "",
          date: apt.startDateTime.toISOString().split("T")[0],
          time: apt.startDateTime.toISOString().split("T")[1].substring(0, 5),
          status: apt.status,
          userEmail: apt.user.email,
          userName: apt.user.name || "",
          createdAt: apt.createdAt.toISOString(),
        }));

        // Generate CSV with required columns
        const csvHeaders = [
          "id",
          "title",
          "description",
          "date",
          "time",
          "status",
          "userEmail",
          "userName",
          "createdAt",
        ];
        const csvRows = [csvHeaders.join(",")];

        for (const apt of exportData) {
          const row = [
            apt.id,
            `"${apt.title.replace(/"/g, '""')}"`,
            apt.description ? `"${apt.description.replace(/"/g, '""')}"` : "",
            apt.date,
            apt.time,
            apt.status,
            apt.userEmail,
            apt.userName ? `"${apt.userName.replace(/"/g, '""')}"` : "",
            apt.createdAt,
          ];
          csvRows.push(row.join(","));
        }

        const csv = csvRows.join("\n");

        // Return CSV or JSON based on format
        if (format === "json") {
          return c.json(exportData, 200, {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="appointments-export-${new Date().toISOString().split("T")[0]}.json"`,
          });
        }

        return c.text(csv, 200, {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="appointments-export-${new Date().toISOString().split("T")[0]}.csv"`,
        });
      } catch (error) {
        console.error("Admin export appointments error:", error);
        return c.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to export appointments",
            },
          },
          500,
        );
      }
    },
  )
  // ============================================
  // POST /api/admin/send-reminder - Send reminder for a specific appointment (Admin only)
  // ============================================
  .post(
    "/send-reminder",
    zValidator(
      "json",
      z.object({
        appointmentId: z.string(),
      }),
    ),
    async (c) => {
      try {
        const isAdminUser = await checkIsAdmin(c);
        if (!isAdminUser) {
          return c.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
            },
            401,
          );
        }

        const { appointmentId } = c.req.valid("json");

        // Get the appointment with user details
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        });

        if (!appointment) {
          return c.json(
            {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: "Appointment not found",
              },
            },
            404,
          );
        }

        // Send reminder email (function handles DB update internally)
        await sendAppointmentReminder(appointmentId);

        return c.json({
          success: true,
          message: "Reminder sent successfully",
        });
      } catch (error) {
        console.error("Admin send reminder error:", error);
        return c.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to send reminder",
            },
          },
          500,
        );
      }
    },
  )
  // ============================================
  // GET /api/admin/users - Get all users (Admin only)
  // ============================================
  .get(
    "/users",
    zValidator(
      "query",
      z.object({
        search: z.string().optional(),
        page: z.string().optional(),
        limit: z.string().optional(),
      }),
    ),
    async (c) => {
      try {
        const isAdminUser = await checkIsAdmin(c);
        if (!isAdminUser) {
          return c.json(
            {
              success: false,
              error: {
                code: "UNAUTHORIZED",
                message: "Authentication required",
              },
            },
            401,
          );
        }

        const { search, page = "1", limit = "10" } = c.req.valid("query");
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: Record<string, unknown> = {
          deletedAt: null,
        };

        if (search) {
          where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            skip,
            take: limitNum,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              emailVerified: true,
              createdAt: true,
              _count: {
                select: {
                  appointments: true,
                },
              },
            },
          }),
          prisma.user.count({ where }),
        ]);

        return c.json({
          success: true,
          data: {
            users,
            meta: {
              total,
              page: pageNum,
              limit: limitNum,
              totalPages: Math.ceil(total / limitNum),
            },
          },
        });
      } catch (error) {
        console.error("Admin users error:", error);
        return c.json(
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to fetch users",
            },
          },
          500,
        );
      }
    },
  );

export default app;

export type AppType = typeof app;
