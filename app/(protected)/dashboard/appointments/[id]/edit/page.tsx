"use client";

import type { Appointment } from "@/features/appointment/types";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppointmentFormStandalone,
  AppointmentFormStandaloneSkeleton,
} from "@/features/appointment/components/appointment-form-standalone";
import { useAppointment } from "@/features/appointment/api/use-appointments";

export default function EditAppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  // Fetch appointment data - hook must be called at top level
  const { data, isLoading, error } = useAppointment(id!);
  const appointment: Appointment | undefined = data?.data;

  const handleSuccess = () => {
    router.push("/dashboard/appointments");
  };

  const handleCancel = () => {
    router.push("/dashboard/appointments");
  };

  // Redirect to /new if no id is provided
  if (!id) {
    router.push("/dashboard/appointments/new");
    return null;
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <AppointmentFormStandaloneSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-destructive">Failed to load appointment</p>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  // Show not found state
  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Edit Appointment
          </h1>
          <p className="text-muted-foreground">
            Update the appointment details below
          </p>
        </div>
      </div>

      {/* Standalone Form */}
      <AppointmentFormStandalone
        appointment={appointment}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
