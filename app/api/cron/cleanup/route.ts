import { Hono } from "hono";
import { handle } from "hono/vercel";
import prisma from "@/lib/prisma";

/**
 * Cleanup Cron Job API
 *
 * This endpoint is designed to be called by a cron job scheduler.
 * It performs two maintenance tasks:
 *
 * 1. Mark Past Appointments as Completed
 *    - Finds all SCHEDULED appointments where endDateTime < now()
 *    - Updates their status to COMPLETED
 *    - Creates audit log entries for each updated appointment
 *
 * 2. Soft Delete Old Cancelled Appointments
 *    - Finds cancelled appointments older than 30 days
 *    - Updates deletedAt timestamp for soft delete
 *
 * Cron schedule suggestion: Run once per day at midnight
 * Example cron expression: "0 0 * * *" (every day at 00:00)
 *
 * Environment variables:
 * - CRON_SECRET: Optional secret key for cron job authentication
 * - CLEANUP_SOFT_DELETE_DAYS: Days before cancelled appointments are soft deleted (default: 30)
 */

const app = new Hono()
  .get("/", async (c) => {
    // Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = c.req.header("x-cron-secret");

    if (cronSecret && requestSecret !== cronSecret) {
      console.warn("[Cron Cleanup] Unauthorized cleanup job attempt");
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing cron secret",
          },
        },
        401,
      );
    }

    const now = new Date();
    const cleanupDays = parseInt(
      process.env.CLEANUP_SOFT_DELETE_DAYS || "30",
      10,
    );
    const thirtyDaysAgo = new Date(
      now.getTime() - cleanupDays * 24 * 60 * 60 * 1000,
    );

    console.log("[Cron Cleanup] Starting cleanup job...", {
      timestamp: now.toISOString(),
      cleanupDays,
    });

    try {
      // Task 1: Mark past scheduled appointments as completed
      const pastScheduledAppointments = await prisma.appointment.findMany({
        where: {
          status: "SCHEDULED",
          endDateTime: { lt: now },
        },
        select: {
          id: true,
          title: true,
          startDateTime: true,
          endDateTime: true,
          userId: true,
        },
      });

      console.log(
        `[Cron Cleanup] Found ${pastScheduledAppointments.length} past scheduled appointments`,
      );

      let completedCount = 0;

      if (pastScheduledAppointments.length > 0) {
        // Update all past scheduled appointments to completed
        await prisma.appointment.updateMany({
          where: {
            id: {
              in: pastScheduledAppointments.map((a) => a.id),
            },
          },
          data: {
            status: "COMPLETED",
          },
        });

        // Create audit log entries for each appointment
        await prisma.auditLog.createMany({
          data: pastScheduledAppointments.map((appointment) => ({
            action: "COMPLETE" as const,
            entityType: "Appointment",
            entityId: appointment.id,
            oldValues: { status: "SCHEDULED" },
            newValues: { status: "COMPLETED" },
            createdById: "system-cron",
            appointmentId: appointment.id,
          })),
        });

        completedCount = pastScheduledAppointments.length;
      }

      // Task 2: Soft delete old cancelled appointments
      const oldCancelledAppointments = await prisma.appointment.findMany({
        where: {
          status: "CANCELLED",
          cancelledAt: { lt: thirtyDaysAgo },
          deletedAt: null, // Not already soft deleted
        },
        select: {
          id: true,
          title: true,
          cancelledAt: true,
        },
      });

      console.log(
        `[Cron Cleanup] Found ${oldCancelledAppointments.length} old cancelled appointments to soft delete`,
      );

      let softDeletedCount = 0;

      if (oldCancelledAppointments.length > 0) {
        // Soft delete all old cancelled appointments
        await prisma.appointment.updateMany({
          where: {
            id: {
              in: oldCancelledAppointments.map((a) => a.id),
            },
          },
          data: {
            deletedAt: now,
          },
        });

        softDeletedCount = oldCancelledAppointments.length;
      }

      console.log("[Cron Cleanup] Cleanup job completed successfully");

      return c.json({
        success: true,
        data: {
          completedAppointments: completedCount,
          softDeletedAppointments: softDeletedCount,
          totalProcessed: completedCount + softDeletedCount,
          details: {
            pastScheduledFound: pastScheduledAppointments.length,
            oldCancelledFound: oldCancelledAppointments.length,
          },
          timestamp: now.toISOString(),
        },
      });
    } catch (error) {
      console.error("[Cron Cleanup] Cleanup job failed:", error);

      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to perform cleanup",
            details: error instanceof Error ? error.message : String(error),
          },
        },
        500,
      );
    }
  })

  // Also support POST for cron systems that use POST requests
  .post("/", async (c) => {
    // Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = c.req.header("x-cron-secret");

    if (cronSecret && requestSecret !== cronSecret) {
      console.warn("[Cron Cleanup] Unauthorized cleanup job attempt (POST)");
      return c.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or missing cron secret",
          },
        },
        401,
      );
    }

    const now = new Date();
    const cleanupDays = parseInt(
      process.env.CLEANUP_SOFT_DELETE_DAYS || "30",
      10,
    );
    const thirtyDaysAgo = new Date(
      now.getTime() - cleanupDays * 24 * 60 * 60 * 1000,
    );

    console.log("[Cron Cleanup] Starting cleanup job (POST)...", {
      timestamp: now.toISOString(),
      cleanupDays,
    });

    try {
      // Task 1: Mark past scheduled appointments as completed
      const pastScheduledAppointments = await prisma.appointment.findMany({
        where: {
          status: "SCHEDULED",
          endDateTime: { lt: now },
        },
        select: {
          id: true,
          title: true,
          startDateTime: true,
          endDateTime: true,
          userId: true,
        },
      });

      console.log(
        `[Cron Cleanup] Found ${pastScheduledAppointments.length} past scheduled appointments`,
      );

      let completedCount = 0;

      if (pastScheduledAppointments.length > 0) {
        // Update all past scheduled appointments to completed
        await prisma.appointment.updateMany({
          where: {
            id: {
              in: pastScheduledAppointments.map((a) => a.id),
            },
          },
          data: {
            status: "COMPLETED",
          },
        });

        // Create audit log entries for each appointment
        await prisma.auditLog.createMany({
          data: pastScheduledAppointments.map((appointment) => ({
            action: "COMPLETE" as const,
            entityType: "Appointment",
            entityId: appointment.id,
            oldValues: { status: "SCHEDULED" },
            newValues: { status: "COMPLETED" },
            createdById: "system-cron",
            appointmentId: appointment.id,
          })),
        });

        completedCount = pastScheduledAppointments.length;
      }

      // Task 2: Soft delete old cancelled appointments
      const oldCancelledAppointments = await prisma.appointment.findMany({
        where: {
          status: "CANCELLED",
          cancelledAt: { lt: thirtyDaysAgo },
          deletedAt: null, // Not already soft deleted
        },
        select: {
          id: true,
          title: true,
          cancelledAt: true,
        },
      });

      console.log(
        `[Cron Cleanup] Found ${oldCancelledAppointments.length} old cancelled appointments to soft delete`,
      );

      let softDeletedCount = 0;

      if (oldCancelledAppointments.length > 0) {
        // Soft delete all old cancelled appointments
        await prisma.appointment.updateMany({
          where: {
            id: {
              in: oldCancelledAppointments.map((a) => a.id),
            },
          },
          data: {
            deletedAt: now,
          },
        });

        softDeletedCount = oldCancelledAppointments.length;
      }

      console.log("[Cron Cleanup] Cleanup job completed successfully");

      return c.json({
        success: true,
        data: {
          completedAppointments: completedCount,
          softDeletedAppointments: softDeletedCount,
          totalProcessed: completedCount + softDeletedCount,
          details: {
            pastScheduledFound: pastScheduledAppointments.length,
            oldCancelledFound: oldCancelledAppointments.length,
          },
          timestamp: now.toISOString(),
        },
      });
    } catch (error) {
      console.error("[Cron Cleanup] Cleanup job failed:", error);

      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to perform cleanup",
            details: error instanceof Error ? error.message : String(error),
          },
        },
        500,
      );
    }
  });

export const GET = handle(app);
export const POST = handle(app);
