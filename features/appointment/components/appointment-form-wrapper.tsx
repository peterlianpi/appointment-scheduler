"use client";

import { AppointmentFormDialog } from "./appointment-form";
import { Appointment } from "@/features/appointment/api/use-appointments";

interface AppointmentFormWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

export function AppointmentFormWrapper({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: AppointmentFormWrapperProps) {
  return (
    <AppointmentFormDialog
      open={open}
      onOpenChange={onOpenChange}
      appointment={appointment}
      onSuccess={onSuccess}
    />
  );
}
