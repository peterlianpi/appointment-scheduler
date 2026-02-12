"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Appointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointment/api/use-appointments";
import { AppointmentFormValues } from "@/features/appointment/types";
import {
  AppointmentFormFields,
  AppointmentFormActions,
} from "./appointment-form-fields";

// ============================================
// Default Form Values
// ============================================

const defaultValues: AppointmentFormValues = {
  title: "",
  description: "",
  startDateTime: "",
  endDateTime: "",
  location: "",
  meetingUrl: "",
  emailNotification: false,
};

// ============================================
// Component Props
// ============================================

interface AppointmentFormStandaloneProps {
  appointment?: Appointment | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// Helper Functions
// ============================================

function formatDateTime(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toISOString();
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
    defaultValues,
  });

  const { reset, handleSubmit } = methods;

  // Reset form when appointment data changes
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
      reset(defaultValues);
    }
  }, [appointment, reset]);

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
      router.push("/appointments");
      onSuccess?.();
    } catch {
      toast.error("Failed to create/update appointment");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/appointments");
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AppointmentFormFields isPending={isPending} />
        <AppointmentFormActions
          isPending={isPending}
          isEditing={isEditing}
          onCancel={handleCancel}
        />
      </form>
    </FormProvider>
  );
}

// ============================================
// Standalone Page Layout Component
// ============================================

interface AppointmentFormPageLayoutProps {
  title: string;
  description: string;
  onBack?: () => void;
  children: React.ReactNode;
}

export function AppointmentFormPageLayout({
  title,
  description,
  onBack,
  children,
}: AppointmentFormPageLayoutProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ============================================
// Loading Skeleton
// ============================================

import { Skeleton } from "@/components/ui/skeleton";

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
