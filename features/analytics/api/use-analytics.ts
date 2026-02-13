import { useQuery } from "@tanstack/react-query";

import type {
  OverviewMetrics,
  OverviewResponse,
  TimeseriesDataPoint,
  TimeseriesResponse,
  StatusDistributionItem,
  StatusDistributionResponse,
  TimeSlotData,
  TimeSlotsResponse,
  HeatmapDataPoint,
  HeatmapResponse,
  TrendDataPoint,
  TrendsResponse,
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
// API Helpers
// ============================================

async function fetchApi<T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> {
  const url = new URL(`/api${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const error = await res.json();
    if ("error" in error) {
      throw new Error(error.error?.message || `Failed to fetch ${endpoint}`);
    }
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

// ============================================
// Queries
// ============================================

export function useAnalyticsOverview() {
  return useQuery({
    queryKey: analyticsKeys.overview(),
    queryFn: async () => {
      const response = await fetchApi<OverviewResponse>("/analytics/overview");
      return response.data;
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
      const response = await fetchApi<TimeseriesResponse>(
        "/analytics/timeseries",
        {
          period: params.period,
          range: params.range.toString(),
          startDate: params.customStartDate ?? "",
          endDate: params.customEndDate ?? "",
        },
      );
      return response.data;
    },
  });
}

export function useAnalyticsStatusDistribution() {
  return useQuery({
    queryKey: analyticsKeys.statusDistribution(),
    queryFn: async () => {
      const response = await fetchApi<StatusDistributionResponse>(
        "/analytics/status-distribution",
      );
      return response.data;
    },
  });
}

export function useAnalyticsTimeSlots() {
  return useQuery({
    queryKey: analyticsKeys.timeSlots(),
    queryFn: async () => {
      const response = await fetchApi<TimeSlotsResponse>(
        "/analytics/time-slots",
      );
      return response.data;
    },
  });
}

export function useAnalyticsHeatmap() {
  return useQuery({
    queryKey: analyticsKeys.heatmap(),
    queryFn: async () => {
      const response = await fetchApi<HeatmapResponse>("/analytics/heatmap");
      return response.data;
    },
  });
}

export function useAnalyticsTrends(params: TrendsQueryParams) {
  return useQuery({
    queryKey: analyticsKeys.trends(params.period),
    queryFn: async () => {
      const response = await fetchApi<TrendsResponse>("/analytics/trends", {
        period: params.period,
      });
      return response.data;
    },
  });
}

// ============================================
// Types Export
// ============================================

export type {
  OverviewMetrics,
  TimeseriesDataPoint,
  StatusDistributionItem,
  TimeSlotData,
  HeatmapDataPoint,
  TrendDataPoint,
  TimeseriesQueryParams,
  TrendsQueryParams,
};
