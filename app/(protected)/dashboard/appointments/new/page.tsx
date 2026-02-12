"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AppointmentFormStandalone,
  AppointmentFormStandaloneSkeleton,
} from "@/features/appointment/components/appointment-form-standalone";

export default function NewAppointmentPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push("/dashboard/appointments");
  };

  const handleCancel = () => {
    router.push("/dashboard/appointments");
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Appointment</h1>
          <p className="text-muted-foreground">
            Fill in the details below to create a new appointment
          </p>
        </div>
      </div>

      {/* Standalone Form */}
      <AppointmentFormStandalone
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
