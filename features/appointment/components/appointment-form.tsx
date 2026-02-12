"use client";

import { useEffect } from "react";
import { FormProvider } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Appointment } from "@/features/appointment/api/use-appointments";
import {
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointment/api/use-appointments";
import { AppointmentFormValues } from "@/features/appointment/types";
import {
  useAppointmentForm,
  formatDateTime,
  appointmentFormDefaultValues,
} from "@/features/appointment/hooks/use-appointment-form";
import {
  AppointmentFormFields,
  AppointmentFormActions,
} from "./appointment-form-fields";

// ============================================
// Component Props
// ============================================

interface AppointmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

// ============================================
// Component
// ============================================

export function AppointmentFormDialog({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: AppointmentFormDialogProps) {
  const isEditing = !!appointment;
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { methods } = useAppointmentForm({ appointment });
  const { reset, handleSubmit } = methods;

  // Reset form when dialog opens or appointment changes
  useEffect(() => {
    if (open) {
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
  }, [appointment, open, reset]);

  const onSubmit = async (values: AppointmentFormValues) => {
    const formattedStartDateTime = formatDateTime(values.startDateTime);
    const formattedEndDateTime = formatDateTime(values.endDateTime);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: appointment!.id,
          title: values.title,
          description: values.description,
          startDateTime: formattedStartDateTime,
          endDateTime: formattedEndDateTime,
          location: values.location,
          meetingUrl: values.meetingUrl,
          emailNotification: values.emailNotification ?? false,
        });
      } else {
        await createMutation.mutateAsync({
          title: values.title,
          description: values.description,
          startDateTime: formattedStartDateTime,
          endDateTime: formattedEndDateTime,
          location: values.location,
          meetingUrl: values.meetingUrl,
          emailNotification: values.emailNotification ?? false,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full my-4 h-full overflow-y-auto">
        <DialogHeader className="relative pr-10">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Edit Appointment" : "Create Appointment"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? "Update the appointment details below."
              : "Fill in the details to create a new appointment."}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AppointmentFormFields isPending={isPending} />
            <DialogFooter className="sm:justify-start gap-2">
              <AppointmentFormActions
                isPending={isPending}
                isEditing={isEditing}
                onCancel={() => onOpenChange(false)}
              />
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

// Keep the old name as an alias for backwards compatibility
export const AppointmentForm = AppointmentFormDialog;
