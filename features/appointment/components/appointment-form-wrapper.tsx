"use client";

import { useState } from "react";
import { AppointmentForm } from "./appointment-form";
import { Appointment } from "@/features/appointment/api/use-appointments";

interface AppointmentFormWrapperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

// Simple mounted check that works for SSR scenarios
function useIsMounted() {
  const [isMounted] = useState(
    () => typeof window !== "undefined"
  );
  return isMounted;
}

export function AppointmentFormWrapper({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: AppointmentFormWrapperProps) {
  const isMounted = useIsMounted();

  return (
    <AppointmentForm
      open={open}
      onOpenChange={onOpenChange}
      appointment={appointment}
      onSuccess={isMounted ? onSuccess : undefined}
    />
  );
}
