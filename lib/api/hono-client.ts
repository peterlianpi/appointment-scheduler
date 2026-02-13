import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>("");

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
// Admin Users Types
// ============================================

export interface AdminUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    appointments: number;
  };
}

export interface AdminUsersResponse {
  success: boolean;
  data: {
    users: AdminUser[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// ============================================
// Admin Users Helper
// ============================================

export async function getAdminUsers(
  params: AdminUsersParams = {},
): Promise<AdminUsersResponse> {
  const query: Record<string, string> = {};
  if (params.search) query.search = params.search;
  if (params.page) query.page = params.page.toString();
  if (params.limit) query.limit = params.limit.toString();

  const response = await client.api.admin.users.$get({ query });

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return (await response.json()) as AdminUsersResponse;
}

// ============================================
// Admin Single User Types
// ============================================

export interface SingleAdminUser extends AdminUser {
  image?: string | null;
  updatedAt?: string;
  banned?: boolean | null;
  banReason?: string | null;
  banExpires?: string | null;
  deletedAt?: string | null;
}

export interface SingleUserResponse {
  success: boolean;
  data: {
    user: SingleAdminUser;
  };
}

export interface UpdateUserParams {
  name?: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
  banExpires?: string;
}

export interface UpdateUserResponse {
  success: boolean;
  data: {
    user: SingleAdminUser;
  };
}

export interface DeleteUserResponse {
  success: boolean;
  data: {
    message: string;
  };
}

// ============================================
// Admin Single User Helper
// ============================================

export async function getAdminUser(
  userId: string,
): Promise<SingleUserResponse> {
  const response = await client.api.admin.users[":id"].$get({
    param: { id: userId },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user");
  }

  return (await response.json()) as SingleUserResponse;
}

// ============================================
// Admin Update User Helper
// ============================================

export async function updateAdminUser(
  userId: string,
  data: UpdateUserParams,
): Promise<UpdateUserResponse> {
  const response = await client.api.admin.users[":id"].$patch({
    param: { id: userId },
    json: data,
  });

  if (!response.ok) {
    const error = (await response.json()) as {
      error?: { message?: string; code?: string };
    };
    throw new Error(error?.error?.message || "Failed to update user");
  }

  return (await response.json()) as UpdateUserResponse;
}

// ============================================
// Admin Delete User Helper
// ============================================

export async function deleteAdminUser(
  userId: string,
): Promise<DeleteUserResponse> {
  const response = await client.api.admin.users[":id"].$delete({
    param: { id: userId },
  });

  if (!response.ok) {
    const error = (await response.json()) as {
      error?: { message?: string; code?: string };
    };
    throw new Error(error?.error?.message || "Failed to delete user");
  }

  return (await response.json()) as DeleteUserResponse;
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

// ============================================
// Analytics Types
// ============================================

export interface AnalyticsOverviewResponse {
  success: boolean;
  data: {
    totalAppointments: number;
    totalAppointmentsCurrentPeriod: number;
    totalAppointmentsPreviousPeriod: number;
    growthRate: number;
    averageAppointmentsPerDay: number;
    completionRate: number;
    cancellationRate: number;
    noShowRate: number;
  };
  timestamp: string;
}

export interface AnalyticsTimeseriesResponse {
  success: boolean;
  data: Array<{
    date: string;
    fullDate: string;
    isoDate: string;
    count: number;
    previousPeriodCount: number;
  }>;
  timestamp: string;
}

export interface AnalyticsStatusDistributionResponse {
  success: boolean;
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  timestamp: string;
}

export interface AnalyticsTimeSlotsResponse {
  success: boolean;
  data: Array<{
    hour: number;
    count: number;
  }>;
  timestamp: string;
}

export interface AnalyticsHeatmapResponse {
  success: boolean;
  data: Array<{
    day: number;
    hour: number;
    count: number;
  }>;
  timestamp: string;
}

export interface AnalyticsTrendsResponse {
  success: boolean;
  data: Array<{
    period: string;
    current: number;
    previous: number;
    growth: number;
  }>;
  timestamp: string;
}
