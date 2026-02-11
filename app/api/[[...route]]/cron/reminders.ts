import { Hono } from "hono";
import { handle } from "hono/vercel";
import { sendBulkReminders } from "@/features/mail/lib/appointment";

/**
 * Reminder Cron Job API
 *
 * This endpoint is designed to be called by a cron job scheduler.
 * It sends reminder emails for appointments scheduled in the next 24 hours.
 *
 * Cron schedule suggestion: Run once per hour to catch appointments
 * that will be due in exactly 24 hours.
 *
 * Example cron expression: "0 * * * *" (every hour at minute 0)
 *
 * Environment variables:
 * - CRON_SECRET: Optional secret key for cron job authentication
 * - TEST_SEND_TO_MAIL: If set, sends all reminders to this email (test mode)
 * - TEST_CRON_INTERVAL_MINUTES: If set, uses this interval in minutes for testing (default: 5)
 * - ENABLE_CRON_SECRET_CHECK: Set to "true" to enable secret validation (default: false)
 */

const app = new Hono()

  .get("/", async (c) => {
    // Check if secret validation is enabled
    const enableSecretCheck = process.env.ENABLE_CRON_SECRET_CHECK === "true";
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = c.req.header("x-cron-secret");

    // Only validate secret if check is enabled and secret is configured
    if (enableSecretCheck && cronSecret && requestSecret !== cronSecret) {
      console.warn("[Cron] Unauthorized reminder job attempt");
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

    try {
      console.log("[Cron] Starting appointment reminder job...");

      const testMode = process.env.TEST_SEND_TO_MAIL;
      const testIntervalMinutes = parseInt(
        process.env.TEST_CRON_INTERVAL_MINUTES || "5",
        10,
      );

      if (testMode) {
        console.log(`[Cron] TEST MODE ENABLED - Sending to: ${testMode}`);
        console.log(
          `[Cron] Test interval: every ${testIntervalMinutes} minutes`,
        );
      }

      const result = await sendBulkReminders({
        testMode,
        testIntervalMinutes,
      });

      console.log("[Cron] Appointment reminder job completed successfully");

      return c.json({
        success: true,
        data: {
          totalAppointmentsFound: result.total,
          remindersSent: result.sent,
          remindersFailed: result.failed,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[Cron] Appointment reminder job failed:", error);

      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to process appointment reminders",
            details: error instanceof Error ? error.message : String(error),
          },
        },
        500,
      );
    }
  })

  // Also support POST for cron systems that use POST requests
  .post("/", async (c) => {
    // Same logic as GET, just different HTTP method
    const cronSecret = process.env.CRON_SECRET;
    const requestSecret = c.req.header("x-cron-secret");

    if (cronSecret && requestSecret !== cronSecret) {
      console.warn("[Cron] Unauthorized reminder job attempt (POST)");
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

    try {
      console.log("[Cron] Starting appointment reminder job (POST)...");

      const testMode = process.env.TEST_SEND_TO_MAIL;
      const testIntervalMinutes = parseInt(
        process.env.TEST_CRON_INTERVAL_MINUTES || "5",
        10,
      );

      if (testMode) {
        console.log(`[Cron] TEST MODE ENABLED - Sending to: ${testMode}`);
        console.log(
          `[Cron] Test interval: every ${testIntervalMinutes} minutes`,
        );
      }

      const result = await sendBulkReminders({
        testMode,
        testIntervalMinutes,
      });

      console.log("[Cron] Appointment reminder job completed successfully");

      return c.json({
        success: true,
        data: {
          totalAppointmentsFound: result.total,
          remindersSent: result.sent,
          remindersFailed: result.failed,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("[Cron] Appointment reminder job failed:", error);

      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to process appointment reminders",
            details: error instanceof Error ? error.message : String(error),
          },
        },
        500,
      );
    }
  });

export const GET = handle(app);
export const POST = handle(app);

export default app;

export type AppType = typeof app;
