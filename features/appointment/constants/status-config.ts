import { CheckCircle2, Circle, CircleX, Loader2 } from "lucide-react";
import type { AppointmentStatus } from "../types";

export const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  NO_SHOW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export const statusProgressConfig: Record<
  AppointmentStatus,
  { icon: typeof Circle; color: string; label: string }
> = {
  SCHEDULED: { icon: Circle, color: "text-blue-500", label: "Scheduled" },
  IN_PROGRESS: { icon: Loader2, color: "text-amber-500", label: "In Progress" },
  COMPLETED: {
    icon: CheckCircle2,
    color: "text-green-500",
    label: "Completed",
  },
  CANCELLED: { icon: CircleX, color: "text-red-500", label: "Cancelled" },
  NO_SHOW: { icon: CircleX, color: "text-yellow-500", label: "No Show" },
};

export const allStatuses: AppointmentStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];
