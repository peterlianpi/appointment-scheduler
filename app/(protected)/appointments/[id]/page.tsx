"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentDetail } from "@/features/appointment/components/appointment-detail";
import { useAppointment } from "@/features/appointment/api/use-appointments";

export default function AppointmentPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  // Fetch appointment data
  const { data, isLoading, error } = useAppointment(id!);
  const appointment = data?.data;

  // Redirect to /new if no id is provided
  if (!id) {
    router.push("/appointments/new");
    return null;
  }

  const handleClose = () => {
    router.push("/appointments");
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
  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">Appointment not found</p>
        <Button variant="outline" onClick={handleClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Appointment Detail */}
      <AppointmentDetail appointmentId={id} onClose={handleClose} />
    </div>
  );
}
