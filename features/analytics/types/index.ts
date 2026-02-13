// ============================================
// ANALYTICS TYPES
// ============================================

// Appointment status type
export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

// ============================================
// OVERVIEW ENDPOINT TYPES
// ============================================

export interface OverviewMetrics {
  totalAppointments: number;
  totalAppointmentsCurrentPeriod: number;
  totalAppointmentsPreviousPeriod: number;
  growthRate: number;
  averageAppointmentsPerDay: number;
  completionRate: number;
  cancellationRate: number;
  noShowRate: number;
}

export interface OverviewResponse {
  success: boolean;
  data: OverviewMetrics;
  timestamp: string;
}

// ============================================
// TIMESERIES ENDPOINT TYPES
// ============================================

export interface TimeseriesDataPoint {
  date: string;
  count: number;
  previousPeriodCount: number;
}

export interface TimeseriesResponse {
  success: boolean;
  data: TimeseriesDataPoint[];
  timestamp: string;
}

// ============================================
// STATUS DISTRIBUTION ENDPOINT TYPES
// ============================================

export interface StatusDistributionItem {
  status: AppointmentStatus;
  count: number;
  percentage: number;
}

export interface StatusDistributionResponse {
  success: boolean;
  data: StatusDistributionItem[];
  timestamp: string;
}

// ============================================
// TIME SLOTS ENDPOINT TYPES
// ============================================

export interface TimeSlotData {
  hour: number;
  count: number;
}

export interface TimeSlotsResponse {
  success: boolean;
  data: TimeSlotData[];
  timestamp: string;
}

// ============================================
// HEATMAP ENDPOINT TYPES
// ============================================

export interface HeatmapDataPoint {
  day: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

export interface HeatmapResponse {
  success: boolean;
  data: HeatmapDataPoint[];
  timestamp: string;
}

// ============================================
// TRENDS ENDPOINT TYPES
// ============================================

export interface TrendDataPoint {
  period: string;
  current: number;
  previous: number;
  growth: number;
}

export interface TrendsResponse {
  success: boolean;
  data: TrendDataPoint[];
  timestamp: string;
}

// ============================================
// ERROR RESPONSE TYPE
// ============================================

export interface ErrorResponse {
  success: boolean;
  error: string;
  code: number;
}

// ============================================
// QUERY PARAM SCHEMAS TYPES
// ============================================

export interface TimeseriesQueryParams {
  period: "day" | "week" | "month";
  range: 30 | 90 | 365;
}

export interface TrendsQueryParams {
  period: "week" | "month";
}
