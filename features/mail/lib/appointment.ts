import prisma from "@/lib/prisma";
import { sendEmail } from "./index";
import {
  generateAppointmentConfirmationEmail,
  generateAppointmentReminderEmail,
  generateAppointmentRescheduledEmail,
  generateAppointmentCancelledEmail,
  type AppointmentEmailData,
} from "../components/templates";
import {
  notifyAppointmentReminder,
  getUserPreferences,
} from "@/lib/services/notifications";

/**
 * Get appointment with user data for email templates
 */
async function getAppointmentForEmail(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!appointment) {
    throw new Error(`Appointment not found: ${appointmentId}`);
  }

  return appointment;
}

/**
 * Build appointment email data from database appointment
 */
function buildEmailData(appointment: {
  title: string;
  description: string | null;
  startDateTime: Date;
  endDateTime: Date;
  duration: number;
  location: string | null;
  meetingUrl: string | null;
  user: { name: string | null; email: string };
}): AppointmentEmailData {
  return {
    name: appointment.user.name || "User",
    email: appointment.user.email,
    title: appointment.title,
    description: appointment.description || undefined,
    startDateTime: appointment.startDateTime,
    endDateTime: appointment.endDateTime,
    duration: appointment.duration,
    location: appointment.location || undefined,
    meetingUrl: appointment.meetingUrl || undefined,
  };
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation(
  appointmentId: string,
): Promise<void> {
  console.log(
    `[AppointmentMail] Sending confirmation email for appointment: ${appointmentId}`,
  );

  try {
    const appointment = await getAppointmentForEmail(appointmentId);
    const emailData = buildEmailData(appointment);

    const { subject, html } = generateAppointmentConfirmationEmail(emailData);

    await sendEmail({
      to: appointment.user.email,
      subject,
      html,
    });

    // Update appointment to mark confirmation sent
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { emailNotificationSent: true },
    });

    console.log(
      `[AppointmentMail] Confirmation email sent successfully to: ${appointment.user.email}`,
    );
  } catch (error) {
    console.error(
      `[AppointmentMail] Failed to send confirmation email:`,
      error,
    );
    throw error;
  }
}

/**
 * Send appointment reminder email
 */
export async function sendAppointmentReminder(
  appointmentId: string,
): Promise<void> {
  console.log(
    `[AppointmentMail] Sending reminder email for appointment: ${appointmentId}`,
  );

  try {
    const appointment = await getAppointmentForEmail(appointmentId);
    const emailData = buildEmailData(appointment);

    const { subject, html } = generateAppointmentReminderEmail(emailData);

    await sendEmail({
      to: appointment.user.email,
      subject,
      html,
    });

    // Update appointment to mark reminder sent
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
    });

    console.log(
      `[AppointmentMail] Reminder email sent successfully to: ${appointment.user.email}`,
    );
  } catch (error) {
    console.error(`[AppointmentMail] Failed to send reminder email:`, error);
    throw error;
  }
}

/**
 * Send appointment rescheduled notification email
 */
export async function sendAppointmentRescheduled(
  appointmentId: string,
  oldStartDateTime?: Date,
  oldEndDateTime?: Date,
): Promise<void> {
  console.log(
    `[AppointmentMail] Sending rescheduled email for appointment: ${appointmentId}`,
  );

  try {
    const appointment = await getAppointmentForEmail(appointmentId);
    const emailData = buildEmailData(appointment);

    const { subject, html } = generateAppointmentRescheduledEmail({
      ...emailData,
      oldStartDateTime,
      oldEndDateTime,
    });

    await sendEmail({
      to: appointment.user.email,
      subject,
      html,
    });

    // Reset reminder sent flag since new date means new reminder needed
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        reminderSent: false,
        reminderSentAt: null,
      },
    });

    console.log(
      `[AppointmentMail] Rescheduled email sent successfully to: ${appointment.user.email}`,
    );
  } catch (error) {
    console.error(`[AppointmentMail] Failed to send rescheduled email:`, error);
    throw error;
  }
}

/**
 * Send appointment cancelled notification email
 */
export async function sendAppointmentCancelled(
  appointmentId: string,
  reason?: string,
): Promise<void> {
  console.log(
    `[AppointmentMail] Sending cancelled email for appointment: ${appointmentId}`,
  );

  try {
    const appointment = await getAppointmentForEmail(appointmentId);
    const emailData = buildEmailData(appointment);

    const { subject, html } = generateAppointmentCancelledEmail({
      ...emailData,
      cancelReason: reason,
    });

    await sendEmail({
      to: appointment.user.email,
      subject,
      html,
    });

    console.log(
      `[AppointmentMail] Cancelled email sent successfully to: ${appointment.user.email}`,
    );
  } catch (error) {
    console.error(`[AppointmentMail] Failed to send cancelled email:`, error);
    throw error;
  }
}

/**
 * Send bulk reminders for appointments based on user preferences
 * This function is designed to be called by a cron job
 *
 * Options:
 * - testMode: If set, sends all reminders to this email address instead of user emails
 * - testIntervalMinutes: In test mode, looks for appointments in the next X minutes (default: 5)
 *
 * Features:
 * - Supports configurable reminder times per user (1 hour, 24 hours, etc.)
 * - Sends both email and in-app notifications based on user preferences
 */
export async function sendBulkReminders(options?: {
  testMode?: string;
  testIntervalMinutes?: number;
}): Promise<{
  total: number;
  sent: number;
  failed: number;
  emailsSent: number;
  inAppSent: number;
}> {
  console.log(`[AppointmentMail] Starting bulk reminder job...`);

  const testMode = options?.testMode;
  const testIntervalMinutes = options?.testIntervalMinutes || 5;

  const now = new Date();

  let startWindow: Date;
  let endWindow: Date;

  if (testMode) {
    // Test mode: look for appointments in the next X minutes
    startWindow = now;
    endWindow = new Date(now.getTime() + testIntervalMinutes * 60 * 1000);
    console.log(
      `[AppointmentMail] TEST MODE: Looking for appointments between ${startWindow.toISOString()} and ${endWindow.toISOString()}`,
    );
  } else {
    // Normal mode: query appointments that will need reminders by the next cron run
    // For daily cron with 24h reminder window: check appointments 23-47 hours away
    // This catches appointments that will be within 24 hours at the next cron run
    // Example: Appointment at 8 PM tomorrow (~44h away at midnight cron)
    // - Would be missed with 0-24h window
    // - With 23-47h window: caught at first midnight, sent ~20h before (acceptable)
    // The 1-hour overlap (23 instead of 24) ensures we don't miss appointments at the edge
    const defaultReminderHours = 24;
    const minHoursAway = defaultReminderHours - 1; // 23 hours
    const maxHoursAway = defaultReminderHours * 2 - 1; // 47 hours (1 hour overlap for edge cases)

    const minHoursAwayMs = minHoursAway * 60 * 60 * 1000;
    const maxHoursAwayMs = maxHoursAway * 60 * 60 * 1000;

    startWindow = new Date(now.getTime() + minHoursAwayMs);
    endWindow = new Date(now.getTime() + maxHoursAwayMs);

    console.log(
      `[AppointmentMail] NORMAL MODE: Looking for appointments between ${startWindow.toISOString()} and ${endWindow.toISOString()} (${minHoursAway}h-${maxHoursAway}h window)`,
    );
  }

  try {
    // Find appointments in the window that haven't had a reminder sent yet
    // In test mode, we include appointments regardless of reminderSent status
    const appointmentsToRemind = await prisma.appointment.findMany({
      where: {
        status: "SCHEDULED",
        ...(testMode ? {} : { reminderSent: false }),
        startDateTime: {
          gte: startWindow,
          lt: endWindow,
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log(
      `[AppointmentMail] Found ${appointmentsToRemind.length} appointments to remind`,
    );

    let sent = 0;
    let failed = 0;
    let emailsSent = 0;
    let inAppSent = 0;

    for (const appointment of appointmentsToRemind) {
      try {
        // Get user preferences for this appointment
        const preferences = await getUserPreferences(appointment.userId);

        // Check if reminders are enabled for this user
        if (!preferences.reminderEnabled) {
          console.log(
            `[AppointmentMail] Reminders disabled for user ${appointment.userId}, skipping appointment ${appointment.id}`,
          );
          continue;
        }

        // Check if appointment is within the user's reminder window
        const reminderWindowMs =
          preferences.reminderHoursBefore * 60 * 60 * 1000;
        const timeUntilAppointment =
          appointment.startDateTime.getTime() - now.getTime();

        if (timeUntilAppointment >= reminderWindowMs) {
          // Appointment is still too far in the future (at or beyond the reminder window), skip for now
          console.log(
            `[AppointmentMail] Appointment ${appointment.id} is ${Math.round(timeUntilAppointment / (60 * 60 * 1000))}h away, user wants reminder at ${preferences.reminderHoursBefore}h, skipping`,
          );
          continue;
        }

        // Check if we've already sent a reminder too recently (within 1 hour)
        // This prevents duplicate reminders if the cron runs frequently
        if (appointment.reminderSent && appointment.reminderSentAt) {
          const timeSinceReminder =
            now.getTime() - appointment.reminderSentAt.getTime();
          if (timeSinceReminder < 60 * 60 * 1000) {
            // Already sent reminder within the last hour, skip
            console.log(
              `[AppointmentMail] Reminder already sent for appointment ${appointment.id} within the last hour, skipping`,
            );
            continue;
          }
        }

        const emailData = buildEmailData(appointment);
        const { subject, html } = generateAppointmentReminderEmail(emailData);

        // Send email reminder if enabled
        if (preferences.emailReminders) {
          // In test mode, send to the test email; otherwise send to user's email
          const recipientEmail = testMode || appointment.user.email;

          await sendEmail({
            to: recipientEmail,
            subject,
            html,
          });

          emailsSent++;
          console.log(
            `[AppointmentMail] Email reminder sent for appointment: ${appointment.id}`,
          );
        }

        // Send in-app notification if enabled
        if (preferences.inAppReminders) {
          await notifyAppointmentReminder({
            userId: appointment.userId,
            appointmentId: appointment.id,
            appointmentTitle: appointment.title,
            startDateTime: appointment.startDateTime,
          });

          inAppSent++;
          console.log(
            `[AppointmentMail] In-app reminder sent for appointment: ${appointment.id}`,
          );
        }

        // Only mark reminder as sent in normal mode (not test mode)
        if (!testMode) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              reminderSent: true,
              reminderSentAt: new Date(),
            },
          });
        } else {
          console.log(
            `[AppointmentMail] TEST MODE: Reminder would be sent for appointment: ${appointment.id}`,
          );
        }

        sent++;
      } catch (error) {
        failed++;
        console.error(
          `[AppointmentMail] Failed to send reminder for appointment ${appointment.id}:`,
          error,
        );
      }
    }

    console.log(
      `[AppointmentMail] Bulk reminder job completed. Total: ${appointmentsToRemind.length}, Sent: ${sent}, Failed: ${failed}, Emails: ${emailsSent}, InApp: ${inAppSent}`,
    );

    return {
      total: appointmentsToRemind.length,
      sent,
      failed,
      emailsSent,
      inAppSent,
    };
  } catch (error) {
    console.error(`[AppointmentMail] Bulk reminder job failed:`, error);
    throw error;
  }
}

/**
 * Send confirmation email asynchronously (non-blocking)
 * Use this for API responses where you don't want to wait for email sending
 */
export async function sendAppointmentConfirmationAsync(
  appointmentId: string,
): Promise<void> {
  // Fire and forget - don't await
  void sendAppointmentConfirmation(appointmentId).catch((error) => {
    console.error(`[AppointmentMail] Async confirmation email failed:`, error);
  });
}

/**
 * Send reschedule notification asynchronously (non-blocking)
 */
export async function sendAppointmentRescheduledAsync(
  appointmentId: string,
  oldStartDateTime?: Date,
  oldEndDateTime?: Date,
): Promise<void> {
  // Fire and forget - don't await
  void sendAppointmentRescheduled(
    appointmentId,
    oldStartDateTime,
    oldEndDateTime,
  ).catch((error) => {
    console.error(`[AppointmentMail] Async rescheduled email failed:`, error);
  });
}

/**
 * Send cancellation notification asynchronously (non-blocking)
 */
export async function sendAppointmentCancelledAsync(
  appointmentId: string,
  reason?: string,
): Promise<void> {
  // Fire and forget - don't await
  void sendAppointmentCancelled(appointmentId, reason).catch((error) => {
    console.error(`[AppointmentMail] Async cancelled email failed:`, error);
  });
}
