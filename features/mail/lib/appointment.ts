import prisma from "@/lib/prisma";
import { sendEmail } from "./index";
import {
  generateAppointmentConfirmationEmail,
  generateAppointmentReminderEmail,
  generateAppointmentRescheduledEmail,
  generateAppointmentCancelledEmail,
  type AppointmentEmailData,
} from "../components/templates";

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
 * Send bulk reminders for appointments in the next 24 hours
 * This function is designed to be called by a cron job
 *
 * Options:
 * - testMode: If set, sends all reminders to this email address instead of user emails
 * - testIntervalMinutes: In test mode, looks for appointments in the next X minutes (default: 5)
 */
export async function sendBulkReminders(options?: {
  testMode?: string;
  testIntervalMinutes?: number;
}): Promise<{
  total: number;
  sent: number;
  failed: number;
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
    // Normal mode: look for appointments in the next 23-24 hours (24 hours before reminder)
    const twentyThreeHoursFromNow = new Date(
      now.getTime() + 23 * 60 * 60 * 1000,
    );
    const twentyFourHoursFromNow = new Date(
      now.getTime() + 24 * 60 * 60 * 1000,
    );
    startWindow = twentyThreeHoursFromNow;
    endWindow = twentyFourHoursFromNow;
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

    for (const appointment of appointmentsToRemind) {
      try {
        const emailData = buildEmailData(appointment);
        const { subject, html } = generateAppointmentReminderEmail(emailData);

        // In test mode, send to the test email; otherwise send to user's email
        const recipientEmail = testMode || appointment.user.email;

        await sendEmail({
          to: recipientEmail,
          subject,
          html,
        });

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
        console.log(
          `[AppointmentMail] Reminder sent for appointment: ${appointment.id}`,
        );
      } catch (error) {
        failed++;
        console.error(
          `[AppointmentMail] Failed to send reminder for appointment ${appointment.id}:`,
          error,
        );
      }
    }

    console.log(
      `[AppointmentMail] Bulk reminder job completed. Total: ${appointmentsToRemind.length}, Sent: ${sent}, Failed: ${failed}`,
    );

    return {
      total: appointmentsToRemind.length,
      sent,
      failed,
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
