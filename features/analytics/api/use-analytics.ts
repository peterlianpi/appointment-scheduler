import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api/hono-client";
import type {
  AnalyticsOverviewResponse,
  AnalyticsTimeseriesResponse,
  AnalyticsStatusDistributionResponse,
  AnalyticsTimeSlotsResponse,
  AnalyticsHeatmapResponse,
  AnalyticsTrendsResponse,
} from "@/lib/api/hono-client";
import type {
  TimeseriesQueryParams,
  TrendsQueryParams,
} from "@/features/analytics/types";

// ============================================
// Query Keys
// ============================================

const analyticsKeys = {
  all: ["analytics"] as const,
  overview: () => [...analyticsKeys.all, "overview"] as const,
  timeseries: (
    period: string,
    range: number,
    startDate?: string,
    endDate?: string,
  ) =>
    [
      ...analyticsKeys.all,
      "timeseries",
      period,
      range,
      startDate,
      endDate,
    ] as const,
  statusDistribution: () =>
    [...analyticsKeys.all, "status-distribution"] as const,
  timeSlots: () => [...analyticsKeys.all, "time-slots"] as const,
  heatmap: () => [...analyticsKeys.all, "heatmap"] as const,
  trends: (period: string) => [...analyticsKeys.all, "trends", period] as const,
};

// Re-export query keys for convenience
export { analyticsKeys };

// ============================================
// Error Type
// ============================================

interface ApiError {
  error?: {
    message?: string;
  };
}

// ============================================
// Queries
// ============================================

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: async () => {
      const res = await client.api.analytics.overview.$get();
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(
          error.error?.message || "Failed to fetch analytics overview",
        );
      }
      return (await res.json()) as AnalyticsOverviewResponse;
    },
  });
}

export function useAnalyticsTimeseries(params: TimeseriesQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.timeseries(
      params.period,
      params.range,
      params.customStartDate,
      params.customEndDate,
    ),
    staleTime: 0, // Force refetch on period change
    queryFn: async () => {
      const res = await client.api.analytics.timeseries.$get({
        query: {
          period: params.period,
          range: params.range.toString(),
          startDate: params.customStartDate ?? "",
          endDate: params.customEndDate ?? "",
        },
      });
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(error.error?.message || "Failed to fetch timeseries data");
      }
      return (await res.json()) as AnalyticsTimeseriesResponse;
    },
  });
}

export function useAnalyticsStatusDistribution() {
  return useQuery({
    queryKey: analyticsKeys.statusDistribution(),
    queryFn: async () => {
      const res = await client.api.analytics["status-distribution"].$get();
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(error.error?.message || "Failed to fetch status distribution");
      }
      return (await res.json()) as AnalyticsStatusDistributionResponse;
    },
  });
}

export function useAnalyticsTimeSlots() {
  return useQuery({
    queryKey: analyticsKeys.timeSlots(),
    queryFn: async () => {
      const res = await client.api.analytics["time-slots"].$get();
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(error.error?.message || "Failed to fetch time slots");
      }
      return (await res.json()) as AnalyticsTimeSlotsResponse;
    },
  });
}

export function useAnalyticsHeatmap() {
  return useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn: async () => {
      const res = await client.api.analytics.heatmap.$get();
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(error.error?.message || "Failed to fetch heatmap data");
      }
      return (await res.json()) as AnalyticsHeatmapResponse;
    },
  });
}

export function useAnalyticsTrends(params: TrendsQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.trends(params.period),
    queryFn: async () => {
      const res = await client.api.analytics.trends.$get({
        query: { period: params.period },
      });
      if (!res.ok) {
        const error = (await res.json()) as ApiError;
        throw new Error(error.error?.message || "Failed to fetch trends data");
      }
      return (await res.json()) as AnalyticsTrendsResponse;
    },
  });
}

// ============================================
// Types Re-export (from types file)
// ============================================

export type {
  TimeseriesDataPoint,
  StatusDistributionItem,
  TimeSlotData,
  HeatmapDataPoint,
  TrendDataPoint,
  TimeseriesQueryParams,
  TrendsQueryParams,
} from "@/features/analytics/types";
