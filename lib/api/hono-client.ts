import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>("");

/**
 * Check if the current user has admin role using Hono RPC
 */
export async function checkAdminRole(): Promise<boolean> {
  try {
    const response = await client.api["check-role"].$get();

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as {
      success: boolean;
      isAdmin: boolean;
    };
    return data.success && data.isAdmin === true;
  } catch (error) {
    console.error("[checkAdminRole] Error:", error);
    return false;
  }
}

// ============================================
// Appointment Export Types
// ============================================

export interface ExportAppointmentsParams {
  startDate?: string;
  endDate?: string;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  format?: "csv" | "json";
}

/**
 * Response type for appointment export - returns a blob
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
  if (params?.format) query.format = params.format;

  const response = await client.api.appointment.export.$get({ query });

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(error?.error?.message || "Failed to export appointments");
  }

  const blob = await response.blob();

  // Create download link and trigger download
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const extension = params?.format === "json" ? "json" : "csv";
  const filename =
    filenameMatch?.[1] ||
    `appointments-export-${new Date().toISOString().split("T")[0]}.${extension}`;

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
// Admin Export Types
// ============================================

export interface AdminExportParams {
  startDate?: string;
  endDate?: string;
  status?: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  format?: "csv" | "json";
}

// ============================================
// Admin Export Helper
// ============================================

export async function adminExportAppointments(
  params?: AdminExportParams,
): Promise<void> {
  // Build query object for the admin export endpoint
  const query: Record<string, string> = {};
  if (params?.startDate) query.startDate = params.startDate;
  if (params?.endDate) query.endDate = params.endDate;
  if (params?.status) query.status = params.status;
  if (params?.format) query.format = params.format;

  const response = await client.api.admin["export-appointments"].$get({
    query,
  });

  if (!response.ok) {
    const error = (await response.json()) as { error?: { message?: string } };
    throw new Error(error?.error?.message || "Failed to export appointments");
  }

  const blob = await response.blob();

  // Create download link and trigger download
  const contentDisposition = response.headers.get("Content-Disposition");
  const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
  const extension = params?.format === "json" ? "json" : "csv";
  const filename =
    filenameMatch?.[1] ||
    `appointments-export-${new Date().toISOString().split("T")[0]}.${extension}`;

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
// Send Reminder Types
// ============================================

export interface SendReminderParams {
  appointmentId: string;
}

export interface SendReminderResponse {
  success: boolean;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// Send Reminder Helper
// ============================================

export async function sendReminder(params: SendReminderParams): Promise<void> {
  const response = await client.api.admin["send-reminder"].$post({
    json: { appointmentId: params.appointmentId },
  });

  if (!response.ok) {
    const error = (await response.json()) as SendReminderResponse;
    throw new Error(error.error?.message || "Failed to send reminder");
  }
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
    cancelledAppointments: number;
    noShowAppointments: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  };
}

// ============================================
// Landing Page Types
// ============================================

export interface LandingPageStats {
  totalUsers: number;
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  satisfactionRate: number;
}

export interface ModelFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  capabilities: string[];
  category: "core" | "scheduling" | "notifications" | "security" | "analytics";
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

export interface LandingPageData {
  stats: LandingPageStats;
  models: ModelFeature[];
  pricingPlans: PricingPlan[];
  testimonials: Testimonial[];
}

export interface LandingPageResponse {
  success: boolean;
  data: LandingPageData;
}
