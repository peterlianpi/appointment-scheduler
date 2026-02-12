"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Appointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointment/api/use-appointments";
import {
  AppointmentFormUI,
  AppointmentFormValues,
} from "./appointment-form-ui";

interface AppointmentFormStandaloneProps {
  appointment?: Appointment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// Component
// ============================================

export function AppointmentFormStandalone({
  appointment,
  onSuccess,
  onCancel,
}: AppointmentFormStandaloneProps) {
  const isEditing = !!appointment;
  const router = useRouter();
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const methods = useForm<AppointmentFormValues>({
    defaultValues: {
      title: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
      meetingUrl: "",
      emailNotification: false,
    },
  });

  const { reset, handleSubmit } = methods;

  // Reset form when appointment changes
  useEffect(() => {
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
      reset({
        title: "",
        description: "",
        startDateTime: "",
        endDateTime: "",
        location: "",
        meetingUrl: "",
        emailNotification: false,
      });
    }
  }, [appointment, reset]);

  // Helper function to format datetime to ISO 8601 format
  const formatDateTime = (value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString();
  };

  const onSubmit = async (values: AppointmentFormValues) => {
    // Validate required fields
    if (!values.startDateTime) {
      toast.error("Start date and time is required");
      return;
    }
    if (!values.endDateTime) {
      toast.error("End date and time is required");
      return;
    }

    try {
      // Format datetime values to ISO 8601 before sending to API
      const formattedStartDateTime = formatDateTime(values.startDateTime);
      const formattedEndDateTime = formatDateTime(values.endDateTime);

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
        toast.success("Appointment updated successfully");
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
        toast.success("Appointment created successfully");
      }
      router.push("/dashboard/appointments");
    } catch {
      toast.error("Failed to create/update appointment");
    }
  };

  return (
    <FormProvider {...methods}>
      <AppointmentFormUI
        isPending={isPending}
        isEditing={isEditing}
        onCancel={onCancel}
        onSubmit={onSubmit}
        submitLabel={isEditing ? "Update" : "Create"}
      />
    </FormProvider>
  );
}

// ============================================
// Loading Skeleton
// ============================================

export function AppointmentFormStandaloneSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-25 w-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-11 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-11 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Skeleton className="h-11 w-24" />
      </div>
    </div>
  );
}
