"use client";

import { useParams, useRouter } from "next/navigation";
import { useAppointment } from "@/features/appointment/api/use-appointments";
import type { Appointment } from "@/features/appointment/types";

export function useEditAppointment() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;

  const { data, isLoading, error } = useAppointment(id!);
  const appointment: Appointment | undefined = data?.data;

  const handleBack = () => {
    router.push("/appointments");
  };

  return {
    id,
    appointment,
    isLoading,
    error,
    handleBack,
  };
}
