import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>("");

// ============================================
// Appointment Export Types
// ============================================

export interface ExportAppointmentsParams {
  startDate?: string;
  endDate?: string;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
}

/**
 * Response type for appointment export - returns a CSV blob
 */
export type ExportAppointmentsResponse = Blob;

// ============================================
// Appointment Export Helper
// ============================================

export async function exportAppointments(
  params?: ExportAppointmentsParams,
): Promise<void> {
  // Build query object for the export endpoint
  const query: Record<string, string> = {};
  if (params?.startDate) query.startDate = params.startDate;
  if (params?.endDate) query.endDate = params.endDate;
  if (params?.status) query.status = params.status;

  const response = await client.api.appointment.export.$get({ query });

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(error?.error?.message || "Failed to export appointments");
  }

  const blob = await response.blob();

  // Create download link and trigger download
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const filename =
    filenameMatch?.[1] ||
    `appointments-export-${new Date().toISOString().split("T")[0]}.csv`;

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

// ============================================
// Admin Stats Types
// ============================================

export interface AdminStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    totalAppointments: number;
    upcomingAppointments: number;
    completedAppointments: number;
  };
}
