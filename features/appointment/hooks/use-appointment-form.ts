"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { Appointment } from "@/features/appointment/api/use-appointments";
import type { AppointmentFormValues } from "@/features/appointment/types";

// ============================================
// Default Form Values
// ============================================

export const appointmentFormDefaultValues: AppointmentFormValues = {
  title: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  location: "",
  meetingUrl: "",
  emailNotification: false,
};

// ============================================
// Helper Functions
// ============================================

export function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
}

export function resetFormFromAppointment(
  reset: (values: AppointmentFormValues) => void,
  appointment?: Appointment | null,
): void {
  if (appointment) {
    reset({
      title: appointment.title,
      description: appointment.description || "",
      startDateTime: appointment.startDateTime,
      endDateTime: appointment.endDateTime,
      location: appointment.location || "",
      meetingUrl: appointment.meetingUrl || "",
      emailNotification: appointment.emailNotificationSent,
    });
  } else {
    reset(appointmentFormDefaultValues);
  }
}

// ============================================
// Hook
// ============================================

interface UseAppointmentFormProps {
  appointment?: Appointment | null;
}

export function useAppointmentForm({ appointment }: UseAppointmentFormProps) {
  const isEditing = !!appointment;

  const methods = useForm<AppointmentFormValues>({
    defaultValues: appointmentFormDefaultValues,
  });

  const { reset } = methods;

  // Reset form when appointment data changes
  useEffect(() => {
    resetFormFromAppointment(reset, appointment);
  }, [appointment, reset]);

  return {
    methods,
    isEditing,
  };
}
