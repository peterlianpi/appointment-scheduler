import prisma from "@/lib/prisma";

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  APPOINTMENT_CREATED: "appointment_created",
  APPOINTMENT_REMINDER: "appointment_reminder",
  APPOINTMENT_RESCHEDULED: "appointment_rescheduled",
  APPOINTMENT_CANCELLED: "appointment_cancelled",
  APPOINTMENT_COMPLETED: "appointment_completed",
  SYSTEM: "system",
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  title,
  description,
  type,
  entityType,
  entityId,
}: {
  userId: string;
  title: string;
  description: string;
  type: NotificationType;
  entityType?: string;
  entityId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        description,
        type,
        entityType,
        entityId,
      },
    });

    console.log(
      `[Notification] Created ${type} notification for user ${userId}`,
    );
    return notification;
  } catch (error) {
    console.error("[Notification] Failed to create notification:", error);
    throw error;
  }
}

/**
 * Create appointment created notification
 */
export async function notifyAppointmentCreated({
  userId,
  appointmentId,
  appointmentTitle,
  startDateTime,
}: {
  userId: string;
  appointmentId: string;
  appointmentTitle: string;
  startDateTime: Date;
}) {
  const formattedDate = startDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    title: "Appointment Created",
    description: `Your appointment "${appointmentTitle}" has been scheduled for ${formattedDate}.`,
    type: NOTIFICATION_TYPES.APPOINTMENT_CREATED,
    entityType: "Appointment",
    entityId: appointmentId,
  });
}

/**
 * Create appointment reminder notification
 */
export async function notifyAppointmentReminder({
  userId,
  appointmentId,
  appointmentTitle,
  startDateTime,
}: {
  userId: string;
  appointmentId: string;
  appointmentTitle: string;
  startDateTime: Date;
}) {
  const formattedDate = startDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    title: "Appointment Reminder",
    description: `Reminder: Your appointment "${appointmentTitle}" is coming up on ${formattedDate}.`,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    entityType: "Appointment",
    entityId: appointmentId,
  });
}

/**
 * Create appointment rescheduled notification
 */
export async function notifyAppointmentRescheduled({
  userId,
  appointmentId,
  appointmentTitle,
  newStartDateTime,
}: {
  userId: string;
  appointmentId: string;
  appointmentTitle: string;
  newStartDateTime: Date;
}) {
  const formattedDate = newStartDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return createNotification({
    userId,
    title: "Appointment Rescheduled",
    description: `Your appointment "${appointmentTitle}" has been rescheduled to ${formattedDate}.`,
    type: NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED,
    entityType: "Appointment",
    entityId: appointmentId,
  });
}

/**
 * Create appointment cancelled notification
 */
export async function notifyAppointmentCancelled({
  userId,
  appointmentId,
  appointmentTitle,
  reason,
}: {
  userId: string;
  appointmentId: string;
  appointmentTitle: string;
  reason?: string;
}) {
  const description = reason
    ? `Your appointment "${appointmentTitle}" has been cancelled. Reason: ${reason}`
    : `Your appointment "${appointmentTitle}" has been cancelled.`;

  return createNotification({
    userId,
    title: "Appointment Cancelled",
    description,
    type: NOTIFICATION_TYPES.APPOINTMENT_CANCELLED,
    entityType: "Appointment",
    entityId: appointmentId,
  });
}

/**
 * Create appointment completed notification
 */
export async function notifyAppointmentCompleted({
  userId,
  appointmentId,
  appointmentTitle,
}: {
  userId: string;
  appointmentId: string;
  appointmentTitle: string;
}) {
  return createNotification({
    userId,
    title: "Appointment Completed",
    description: `Your appointment "${appointmentTitle}" has been marked as completed.`,
    type: NOTIFICATION_TYPES.APPOINTMENT_COMPLETED,
    entityType: "Appointment",
    entityId: appointmentId,
  });
}

/**
 * Get user preferences or default values
 */
export async function getUserPreferences(userId: string) {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  return {
    reminderEnabled: preferences?.reminderEnabled ?? true,
    reminderHoursBefore: preferences?.reminderHoursBefore ?? 24,
    emailReminders: preferences?.emailReminders ?? true,
    inAppReminders: preferences?.inAppReminders ?? true,
    appointmentCreatedNotif: preferences?.appointmentCreatedNotif ?? true,
    appointmentRescheduledNotif:
      preferences?.appointmentRescheduledNotif ?? true,
    appointmentCancelledNotif: preferences?.appointmentCancelledNotif ?? true,
  };
}
