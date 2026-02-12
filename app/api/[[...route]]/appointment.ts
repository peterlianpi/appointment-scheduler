import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { Prisma, AuditAction } from "@/lib/generated/prisma/client";
import type { Context } from "hono";
import {
  sendAppointmentConfirmationAsync,
  sendAppointmentRescheduledAsync,
  sendAppointmentCancelledAsync,
} from "@/features/mail/lib/appointment";
import {
  notifyAppointmentCreated,
  notifyAppointmentRescheduled,
  notifyAppointmentCancelled,
  notifyAppointmentCompleted,
} from "@/lib/services/notifications";

// ============================================
// TYPES & INTERFACES
// ============================================

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

const appointmentIdSchema = z.object({
  id: z.cuid("Invalid appointment ID"),
});

const createAppointmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  startDateTime: z.iso.datetime("Invalid start datetime format"),
  endDateTime: z.iso.datetime("Invalid end datetime format"),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingUrl: z.url().optional().or(z.literal("")),
  emailNotification: z.boolean().optional().default(false),
});

const updateAppointmentSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().optional(),
  startDateTime: z.iso.datetime("Invalid start datetime format").optional(),
  endDateTime: z.iso.datetime("Invalid end datetime format").optional(),
  duration: z.number().int().positive().optional(),
  location: z.string().optional(),
  meetingUrl: z.url().optional().or(z.literal("")),
  emailNotification: z.boolean().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(["COMPLETED", "NO_SHOW", "CANCELLED"]),
  reason: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.string().optional(), // Comma-separated statuses for multi-select
  statuses: z.string().optional(), // Alternative: comma-separated statuses
  search: z.string().optional(),
  searchFields: z.string().optional().default("title,description"), // Fields to search in
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  dateRangeType: z.enum(["upcoming", "past", "all"]).optional().default("all"),
  userId: z.string().optional(),
});

const exportQuerySchema = z.object({
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateDuration(startDateTime: Date, endDateTime: Date): number {
  const diffMs = endDateTime.getTime() - startDateTime.getTime();
  return Math.ceil(diffMs / 60000);
}

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

async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      createdById: params.userId,
      oldValues: params.oldValues as Prisma.InputJsonValue,
      newValues: params.newValues as Prisma.InputJsonValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

function jsonResponse<T>(
  c: Context,
  data: ApiResponse<T>,
  status?: number | undefined,
) {
  return c.json(data, status as 200 | 401 | 403 | 404 | 500 | undefined);
}

// ============================================
// APPOINTMENT ROUTER
// ============================================

const app = new Hono()
  // ============================================
  // GET /api/appointment - List appointments
  // ============================================
  .get("/", zValidator("query", listQuerySchema), async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const {
        page,
        limit,
        status,
        statuses,
        search,
        searchFields,
        startDate,
        endDate,
        dateRangeType,
        userId,
      } = c.req.valid("query");

      const isAdminUser = await isAdmin(sessionUser.id);
      const actualUserId = isAdminUser && userId ? userId : sessionUser.id;

      // Parse multi-status from comma-separated string
      const statusList = statuses || status;
      const statusArray = statusList
        ? statusList
            .split(",")
            .filter((s: string) =>
              ["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"].includes(s),
            )
        : undefined;

      const where: Record<string, unknown> = {
        userId: actualUserId,
        deletedAt: null,
      };

      // Multi-status filter
      if (statusArray && statusArray.length > 0) {
        where.status = { in: statusArray };
      }

      // Date range filter
      if (dateRangeType === "upcoming") {
        where.startDateTime = { gte: new Date() };
      } else if (dateRangeType === "past") {
        where.startDateTime = { lt: new Date() };
      } else if (startDate || endDate) {
        where.startDateTime = {};
        if (startDate)
          (where.startDateTime as Record<string, Date>).gte = new Date(
            startDate,
          );
        if (endDate)
          (where.startDateTime as Record<string, Date>).lte = new Date(endDate);
      }

      // Enhanced search across multiple fields
      if (search) {
        const searchFieldsArray = searchFields
          .split(",")
          .map((f: string) => f.trim());
        const searchConditions: Prisma.AppointmentWhereInput[] = [];

        // Always search in title and description
        searchConditions.push(
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        );

        // Search in additional fields if specified
        if (searchFieldsArray.includes("location")) {
          searchConditions.push({
            location: { contains: search, mode: "insensitive" },
          });
        }
        if (
          searchFieldsArray.includes("notes") ||
          searchFieldsArray.includes("all")
        ) {
          // Notes field doesn't exist, but could be extended
        }

        // Admin-only: search by user email
        if (
          isAdminUser &&
          (searchFieldsArray.includes("email") ||
            searchFieldsArray.includes("all"))
        ) {
          // This requires a different approach - use relation query
          where.AND = [
            {
              user: {
                OR: [
                  { email: { contains: search, mode: "insensitive" } },
                  { name: { contains: search, mode: "insensitive" } },
                ],
              },
            },
          ];
        }

        // Add OR condition for text search (unless admin email search is used)
        if (!isAdminUser || !searchFieldsArray.includes("email")) {
          where.OR = searchConditions;
        }
      }

      if (!isAdminUser && userId && userId !== sessionUser.id) {
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot access other users' appointments",
            },
          },
          403,
        );
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          orderBy: { startDateTime: "asc" },
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            title: true,
            description: true,
            startDateTime: true,
            endDateTime: true,
            duration: true,
            status: true,
            location: true,
            meetingUrl: true,
            emailNotificationSent: true,
            reminderSent: true,
            reminderSentAt: true,
            cancelledAt: true,
            cancelReason: true,
            createdAt: true,
            updatedAt: true,
            userId: true,
            // Include user info for admin email search results
            user: isAdminUser
              ? {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                }
              : false,
          },
        }),
        prisma.appointment.count({ where }),
      ]);

      return jsonResponse(c, {
        success: true,
        data: appointments,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("List appointments error:", error);
      return jsonResponse(
        c,
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to list appointments",
          },
        },
        500,
      );
    }
  })

  // ============================================
  // GET /api/appointment/:id - Get single appointment
  // ============================================
  .get("/:id", zValidator("param", appointmentIdSchema), async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const { id } = c.req.valid("param");

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          description: true,
          startDateTime: true,
          endDateTime: true,
          duration: true,
          status: true,
          location: true,
          meetingUrl: true,
          emailNotificationSent: true,
          reminderSent: true,
          reminderSentAt: true,
          cancelledAt: true,
          cancelReason: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });

      if (!appointment) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Appointment not found" },
          },
          404,
        );
      }

      const isAdminUser = await isAdmin(sessionUser.id);
      if (!isAdminUser && appointment.userId !== sessionUser.id) {
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot access this appointment",
            },
          },
          403,
        );
      }

      await createAuditLog({
        action: "VIEW",
        entityType: "Appointment",
        entityId: id,
        userId: sessionUser.id,
        newValues: { viewedAt: new Date().toISOString() },
      });

      return jsonResponse(c, {
        success: true,
        data: appointment,
      });
    } catch (error) {
      console.error("Get appointment error:", error);
      return jsonResponse(
        c,
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to get appointment",
          },
        },
        500,
      );
    }
  })

  // ============================================
  // POST /api/appointment - Create appointment
  // ============================================
  .post("/", zValidator("json", createAppointmentSchema), async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const body = c.req.valid("json");
      const startDateTime = new Date(body.startDateTime);
      const endDateTime = new Date(body.endDateTime);

      if (endDateTime <= startDateTime) {
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "INVALID_DATA",
              message: "End datetime must be after start datetime",
            },
          },
          400,
        );
      }

      const duration =
        body.duration || calculateDuration(startDateTime, endDateTime);

      const appointment = await prisma.appointment.create({
        data: {
          title: body.title,
          description: body.description,
          startDateTime,
          endDateTime,
          duration,
          status: "SCHEDULED",
          location: body.location,
          meetingUrl: body.meetingUrl,
          emailNotificationSent: body.emailNotification || false,
          userId: sessionUser.id,
        },
        select: {
          id: true,
          title: true,
          description: true,
          startDateTime: true,
          endDateTime: true,
          duration: true,
          status: true,
          location: true,
          meetingUrl: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
        },
      });

      await createAuditLog({
        action: "CREATE",
        entityType: "Appointment",
        entityId: appointment.id,
        userId: sessionUser.id,
        newValues: {
          title: appointment.title,
          startDateTime: appointment.startDateTime.toISOString(),
          endDateTime: appointment.endDateTime.toISOString(),
          duration: appointment.duration,
          status: appointment.status,
        },
      });

      // Send confirmation email asynchronously if requested
      if (body.emailNotification) {
        sendAppointmentConfirmationAsync(appointment.id).catch((error) => {
          console.error(
            "[Appointment] Failed to send confirmation email:",
            error,
          );
        });
      }

      // Send in-app notification asynchronously
      notifyAppointmentCreated({
        userId: sessionUser.id,
        appointmentId: appointment.id,
        appointmentTitle: appointment.title,
        startDateTime: appointment.startDateTime,
      }).catch((error) => {
        console.error(
          "[Appointment] Failed to send in-app notification:",
          error,
        );
      });

      return jsonResponse(
        c,
        {
          success: true,
          data: appointment,
        },
        201,
      );
    } catch (error) {
      console.error("Create appointment error:", error);
      return jsonResponse(
        c,
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to create appointment",
          },
        },
        500,
      );
    }
  })

  // ============================================
  // PUT /api/appointment/:id - Update appointment
  // ============================================
  .put(
    "/:id",
    zValidator("param", appointmentIdSchema),
    zValidator("json", updateAppointmentSchema),
    async (c) => {
      try {
        const sessionUser = await getSessionUser(c);
        if (!sessionUser) {
          return jsonResponse(
            c,
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

        const { id } = c.req.valid("param");
        const body = c.req.valid("json");

        const existingAppointment = await prisma.appointment.findUnique({
          where: { id },
          select: {
            id: true,
            title: true,
            description: true,
            startDateTime: true,
            endDateTime: true,
            duration: true,
            status: true,
            location: true,
            meetingUrl: true,
            userId: true,
          },
        });

        if (!existingAppointment) {
          return jsonResponse(
            c,
            {
              success: false,
              error: { code: "NOT_FOUND", message: "Appointment not found" },
            },
            404,
          );
        }

        const isAdminUser = await isAdmin(sessionUser.id);
        if (!isAdminUser && existingAppointment.userId !== sessionUser.id) {
          return jsonResponse(
            c,
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Cannot modify this appointment",
              },
            },
            403,
          );
        }

        if (existingAppointment.status !== "SCHEDULED") {
          return jsonResponse(
            c,
            {
              success: false,
              error: {
                code: "INVALID_STATUS",
                message: `Cannot modify appointment with status: ${existingAppointment.status}`,
              },
            },
            400,
          );
        }

        const hasDateChanges =
          (body.startDateTime &&
            new Date(body.startDateTime).getTime() !==
              existingAppointment.startDateTime.getTime()) ||
          (body.endDateTime &&
            new Date(body.endDateTime).getTime() !==
              existingAppointment.endDateTime.getTime());

        const updateData: Record<string, unknown> = {};

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined)
          updateData.description = body.description;
        if (body.location !== undefined) updateData.location = body.location;
        if (body.meetingUrl !== undefined)
          updateData.meetingUrl = body.meetingUrl;
        if (body.emailNotification !== undefined)
          updateData.emailNotificationSent = body.emailNotification;

        if (body.startDateTime || body.endDateTime) {
          const newStartDateTime = body.startDateTime
            ? new Date(body.startDateTime)
            : existingAppointment.startDateTime;
          const newEndDateTime = body.endDateTime
            ? new Date(body.endDateTime)
            : existingAppointment.endDateTime;

          if (newEndDateTime <= newStartDateTime) {
            return jsonResponse(
              c,
              {
                success: false,
                error: {
                  code: "INVALID_DATA",
                  message: "End datetime must be after start datetime",
                },
              },
              400,
            );
          }

          updateData.startDateTime = newStartDateTime;
          updateData.endDateTime = newEndDateTime;
          updateData.duration = calculateDuration(
            newStartDateTime,
            newEndDateTime,
          );
        }

        if (body.duration !== undefined) {
          updateData.duration = body.duration;
        }

        const updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            title: true,
            description: true,
            startDateTime: true,
            endDateTime: true,
            duration: true,
            status: true,
            location: true,
            meetingUrl: true,
            updatedAt: true,
          },
        });

        const action: AuditAction = hasDateChanges ? "RESCHEDULE" : "UPDATE";
        await createAuditLog({
          action,
          entityType: "Appointment",
          entityId: id,
          userId: sessionUser.id,
          oldValues: {
            title: existingAppointment.title,
            description: existingAppointment.description,
            startDateTime: existingAppointment.startDateTime.toISOString(),
            endDateTime: existingAppointment.endDateTime.toISOString(),
            duration: existingAppointment.duration,
          },
          newValues: {
            title: updatedAppointment.title,
            description: updatedAppointment.description,
            startDateTime: updatedAppointment.startDateTime.toISOString(),
            endDateTime: updatedAppointment.endDateTime.toISOString(),
            duration: updatedAppointment.duration,
          },
        });

        // Send reschedule notification if dates changed
        if (hasDateChanges) {
          sendAppointmentRescheduledAsync(
            id,
            existingAppointment.startDateTime,
            existingAppointment.endDateTime,
          ).catch((error) => {
            console.error(
              "[Appointment] Failed to send reschedule notification:",
              error,
            );
          });

          // Send in-app notification
          notifyAppointmentRescheduled({
            userId: sessionUser.id,
            appointmentId: id,
            appointmentTitle: existingAppointment.title,
            newStartDateTime: updatedAppointment.startDateTime,
          }).catch((error) => {
            console.error(
              "[Appointment] Failed to send reschedule in-app notification:",
              error,
            );
          });
        }

        return jsonResponse(c, {
          success: true,
          data: updatedAppointment,
        });
      } catch (error) {
        console.error("Update appointment error:", error);
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to update appointment",
            },
          },
          500,
        );
      }
    },
  )

  // ============================================
  // DELETE /api/appointment/:id - Delete appointment (soft delete)
  // ============================================
  .delete("/:id", zValidator("param", appointmentIdSchema), async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const { id } = c.req.valid("param");

      const existingAppointment = await prisma.appointment.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          userId: true,
          title: true,
        },
      });

      if (!existingAppointment) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "NOT_FOUND", message: "Appointment not found" },
          },
          404,
        );
      }

      const isAdminUser = await isAdmin(sessionUser.id);
      if (!isAdminUser && existingAppointment.userId !== sessionUser.id) {
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "FORBIDDEN",
              message: "Cannot delete this appointment",
            },
          },
          403,
        );
      }

      const deletedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: "CANCELLED",
          deletedAt: new Date(),
          cancelledAt: new Date(),
          cancelReason: "Deleted by user",
        },
        select: {
          id: true,
          title: true,
          status: true,
          cancelledAt: true,
          cancelReason: true,
          updatedAt: true,
        },
      });

      await createAuditLog({
        action: "CANCEL",
        entityType: "Appointment",
        entityId: id,
        userId: sessionUser.id,
        newValues: {
          status: "CANCELLED",
          deletedAt: new Date().toISOString(),
          cancelReason: "Deleted by user",
        },
      });

      // Send cancellation notification asynchronously
      sendAppointmentCancelledAsync(id, "Deleted by user").catch((error) => {
        console.error(
          "[Appointment] Failed to send cancellation notification:",
          error,
        );
      });

      // Send in-app notification
      notifyAppointmentCancelled({
        userId: sessionUser.id,
        appointmentId: id,
        appointmentTitle: existingAppointment.title,
        reason: "Deleted by user",
      }).catch((error) => {
        console.error(
          "[Appointment] Failed to send cancellation in-app notification:",
          error,
        );
      });

      return jsonResponse(c, {
        success: true,
        data: deletedAppointment,
      });
    } catch (error) {
      console.error("Delete appointment error:", error);
      return jsonResponse(
        c,
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to delete appointment",
          },
        },
        500,
      );
    }
  })

  // ============================================
  // PATCH /api/appointment/:id/status - Update appointment status
  // ============================================
  .patch(
    "/:id/status",
    zValidator("param", appointmentIdSchema),
    zValidator("json", statusUpdateSchema),
    async (c) => {
      try {
        const sessionUser = await getSessionUser(c);
        if (!sessionUser) {
          return jsonResponse(
            c,
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

        const { id } = c.req.valid("param");
        const { status, reason } = c.req.valid("json");

        const existingAppointment = await prisma.appointment.findUnique({
          where: { id },
          select: {
            id: true,
            status: true,
            userId: true,
            title: true,
            startDateTime: true,
            endDateTime: true,
          },
        });

        if (!existingAppointment) {
          return jsonResponse(
            c,
            {
              success: false,
              error: { code: "NOT_FOUND", message: "Appointment not found" },
            },
            404,
          );
        }

        const isAdminUser = await isAdmin(sessionUser.id);
        if (!isAdminUser && existingAppointment.userId !== sessionUser.id) {
          return jsonResponse(
            c,
            {
              success: false,
              error: {
                code: "FORBIDDEN",
                message: "Cannot modify this appointment",
              },
            },
            403,
          );
        }

        if (existingAppointment.status === "CANCELLED") {
          return jsonResponse(
            c,
            {
              success: false,
              error: {
                code: "INVALID_STATUS",
                message: "Cannot modify cancelled appointment",
              },
            },
            400,
          );
        }

        const validTransitions: Record<string, string[]> = {
          SCHEDULED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
          COMPLETED: [],
          NO_SHOW: ["CANCELLED"],
          CANCELLED: [],
        };

        const allowedTransitions = validTransitions[existingAppointment.status];
        if (!allowedTransitions?.includes(status)) {
          return jsonResponse(
            c,
            {
              success: false,
              error: {
                code: "INVALID_STATUS",
                message: `Cannot transition from ${existingAppointment.status} to ${status}`,
              },
            },
            400,
          );
        }

        const updateData: Record<string, unknown> = { status };

        if (status === "CANCELLED") {
          updateData.cancelledAt = new Date();
          updateData.cancelReason = reason || "Cancelled by user";
        }

        const updatedAppointment = await prisma.appointment.update({
          where: { id },
          data: updateData,
          select: {
            id: true,
            title: true,
            status: true,
            cancelledAt: true,
            cancelReason: true,
            updatedAt: true,
          },
        });

        const action: AuditAction =
          status === "COMPLETED" ? "COMPLETE" : "CANCEL";
        await createAuditLog({
          action,
          entityType: "Appointment",
          entityId: id,
          userId: sessionUser.id,
          oldValues: { status: existingAppointment.status },
          newValues: {
            status: updatedAppointment.status,
            cancelledAt: updatedAppointment.cancelledAt?.toISOString(),
            cancelReason: updatedAppointment.cancelReason,
          },
        });

        // Send cancellation notification if status is CANCELLED
        if (status === "CANCELLED") {
          sendAppointmentCancelledAsync(id, reason).catch((error) => {
            console.error(
              "[Appointment] Failed to send cancellation notification:",
              error,
            );
          });

          // Send in-app notification
          notifyAppointmentCancelled({
            userId: sessionUser.id,
            appointmentId: id,
            appointmentTitle: existingAppointment.title,
            reason,
          }).catch((error) => {
            console.error(
              "[Appointment] Failed to send cancellation in-app notification:",
              error,
            );
          });
        }

        // Send completion notification if status is COMPLETED
        if (status === "COMPLETED") {
          notifyAppointmentCompleted({
            userId: sessionUser.id,
            appointmentId: id,
            appointmentTitle: existingAppointment.title,
          }).catch((error) => {
            console.error(
              "[Appointment] Failed to send completion in-app notification:",
              error,
            );
          });
        }

        return jsonResponse(c, {
          success: true,
          data: updatedAppointment,
        });
      } catch (error) {
        console.error("Update status error:", error);
        return jsonResponse(
          c,
          {
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Failed to update appointment status",
            },
          },
          500,
        );
      }
    },
  )

  // ============================================
  // GET /api/appointment/export - Export appointments (Admin only)
  // ============================================
  .get("/export", zValidator("query", exportQuerySchema), async (c) => {
    try {
      const sessionUser = await getSessionUser(c);
      if (!sessionUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "UNAUTHORIZED", message: "Authentication required" },
          },
          401,
        );
      }

      const isAdminUser = await isAdmin(sessionUser.id);
      if (!isAdminUser) {
        return jsonResponse(
          c,
          {
            success: false,
            error: { code: "FORBIDDEN", message: "Admin access required" },
          },
          403,
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
          (where.startDateTime as Record<string, Date>).lte = new Date(endDate);
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

      await createAuditLog({
        action: "VIEW",
        entityType: "Appointment",
        entityId: "bulk-export",
        userId: sessionUser.id,
        newValues: {
          exportedCount: appointments.length,
          exportedAt: new Date().toISOString(),
        },
      });

      return c.text(csv, 200, {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="appointments-export-${new Date().toISOString().split("T")[0]}.csv"`,
      });
    } catch (error) {
      console.error("Export appointments error:", error);
      return jsonResponse(
        c,
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
  });

export default app;
