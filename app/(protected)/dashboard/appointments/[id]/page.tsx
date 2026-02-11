"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentForm } from "@/features/appointment/components/appointment-form";
import { useAppointment } from "@/features/appointment/api/use-appointments";

export default function AppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  // "new" means creating a new appointment
  const isNew = id === "new";
  // Otherwise, we have an actual id to edit
  const appointmentId = !isNew && id ? id : null;

  // Fetch appointment data if editing
  const { data, isLoading, error } = useAppointment(appointmentId);
  const appointment = data?.data;

  const handleSuccess = () => {
    router.push("/dashboard/appointments");
  };

  const handleClose = () => {
    router.push("/dashboard/appointments");
  };

  // Show loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  // Show error if appointment not found
  if (error || (!isNew && !appointment)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Failed to load appointment</p>
        <Button variant="outline" onClick={handleClose}>
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
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "Create Appointment" : "Edit Appointment"}
          </h1>
          <p className="text-muted-foreground">
            {isNew
              ? "Fill in the details to create a new appointment"
              : "Update the appointment details below"}
          </p>
        </div>
      </div>

      {/* Form - using Dialog component for consistent styling */}
      <AppointmentForm
        open={true}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        appointment={appointment ?? null}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
