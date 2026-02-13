"use client";

import { useEditAppointment } from "@/features/appointment/hooks/use-edit-appointment";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AppointmentFormStandalone,
  AppointmentFormStandaloneSkeleton,
} from "./appointment-form-standalone";

function EditAppointmentLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <AppointmentFormStandaloneSkeleton />
    </div>
  );
}

function EditAppointmentError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-destructive">{message}</p>
      <Button variant="outline" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>
    </div>
  );
}

function EditAppointmentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-muted-foreground">Appointment not found</p>
      <Button variant="outline" onClick={() => window.history.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Go back
      </Button>
    </div>
  );
}

export function EditAppointmentPage() {
  const { id, appointment, isLoading, error, handleBack } =
    useEditAppointment();

  // Redirect to /new if no id is provided
  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Invalid appointment ID</p>
        <Button variant="outline" onClick={() => (window.location.href = "/appointments/new")}>
          Create new appointment
        </Button>
      </div>
    );
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return <EditAppointmentLoading />;
  }

  // Show error state
  if (error) {
    return <EditAppointmentError message="Failed to load appointment" />;
  }

  // Show not found state
  if (!appointment) {
    return <EditAppointmentNotFound />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Appointment</h1>
          <p className="text-muted-foreground">
            Update the appointment details below
          </p>
        </div>
      </div>
      <AppointmentFormStandalone appointment={appointment} />
    </div>
  );
}
