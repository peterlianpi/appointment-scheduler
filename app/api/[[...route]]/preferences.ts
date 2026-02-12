import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const updatePreferencesSchema = z.object({
  reminderEnabled: z.boolean().optional(),
  reminderHoursBefore: z.number().int().min(1).max(168).optional(), // 1 hour to 7 days
  emailReminders: z.boolean().optional(),
  inAppReminders: z.boolean().optional(),
  appointmentCreatedNotif: z.boolean().optional(),
  appointmentRescheduledNotif: z.boolean().optional(),
  appointmentCancelledNotif: z.boolean().optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getOrCreatePreferences(userId: string) {
  let preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) {
    preferences = await prisma.userPreferences.create({
      data: { userId },
    });
  }

  return preferences;
}

// ============================================
// PREFERENCES ROUTER
// ============================================

const app = new Hono()
  // ============================================
  // GET /api/preferences - Get user preferences
  // ============================================
  .get("/", async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    try {
      const preferences = await getOrCreatePreferences(session.user.id);

      return c.json({
        success: true,
        data: {
          reminderEnabled: preferences.reminderEnabled,
          reminderHoursBefore: preferences.reminderHoursBefore,
          emailReminders: preferences.emailReminders,
          inAppReminders: preferences.inAppReminders,
          appointmentCreatedNotif: preferences.appointmentCreatedNotif,
          appointmentRescheduledNotif: preferences.appointmentRescheduledNotif,
          appointmentCancelledNotif: preferences.appointmentCancelledNotif,
        },
      });
    } catch (error) {
      console.error("Get preferences error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to get preferences",
          },
        },
        500,
      );
    }
  })

  // ============================================
  // PUT /api/preferences - Update user preferences
  // ============================================
  .put("/", zValidator("json", updatePreferencesSchema), async (c) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session?.user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = c.req.valid("json");

    try {
      const preferences = await getOrCreatePreferences(session.user.id);

      const updateData: Record<string, unknown> = {};

      if (body.reminderEnabled !== undefined)
        updateData.reminderEnabled = body.reminderEnabled;
      if (body.reminderHoursBefore !== undefined)
        updateData.reminderHoursBefore = body.reminderHoursBefore;
      if (body.emailReminders !== undefined)
        updateData.emailReminders = body.emailReminders;
      if (body.inAppReminders !== undefined)
        updateData.inAppReminders = body.inAppReminders;
      if (body.appointmentCreatedNotif !== undefined)
        updateData.appointmentCreatedNotif = body.appointmentCreatedNotif;
      if (body.appointmentRescheduledNotif !== undefined)
        updateData.appointmentRescheduledNotif =
          body.appointmentRescheduledNotif;
      if (body.appointmentCancelledNotif !== undefined)
        updateData.appointmentCancelledNotif = body.appointmentCancelledNotif;

      const updated = await prisma.userPreferences.update({
        where: { id: preferences.id },
        data: updateData,
      });

      console.log(
        `[Preferences] User ${session.user.id} updated their preferences`,
      );

      return c.json({
        success: true,
        data: {
          reminderEnabled: updated.reminderEnabled,
          reminderHoursBefore: updated.reminderHoursBefore,
          emailReminders: updated.emailReminders,
          inAppReminders: updated.inAppReminders,
          appointmentCreatedNotif: updated.appointmentCreatedNotif,
          appointmentRescheduledNotif: updated.appointmentRescheduledNotif,
          appointmentCancelledNotif: updated.appointmentCancelledNotif,
        },
      });
    } catch (error) {
      console.error("Update preferences error:", error);
      return c.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to update preferences",
          },
        },
        500,
      );
    }
  });

export default app;
