"use client";

import * as React from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AnalyticsStatsGrid } from "@/features/analytics/components/analytics-stats-grid";
import { TimeSeriesChart } from "@/features/analytics/components/time-series-chart";
import { StatusDistributionChart } from "@/features/analytics/components/status-distribution-chart";
import { AppointmentHeatmap } from "@/features/analytics/components/appointment-heatmap";
import { TimeSlotsChart } from "@/features/analytics/components/time-slots-chart";
import { TrendComparisonChart } from "@/features/analytics/components/trend-comparison-chart";
import { AnalyticsFilters } from "@/features/analytics/components/analytics-filters";
import {
  useAnalyticsOverview,
  useAnalyticsTimeseries,
  useAnalyticsStatusDistribution,
  useAnalyticsTimeSlots,
  useAnalyticsHeatmap,
  useAnalyticsTrends,
} from "@/features/analytics/api/use-analytics";
import type { FilterState } from "@/features/analytics/components/analytics-filters";

// Helper to extract data from wrapped response
function getData<T>(response: { data?: T } | undefined): T | undefined {
  return response?.data;
}

interface AnalyticsDashboardProps {
  onFilterChange?: (filters: FilterState) => void;
  filters?: FilterState;
}

export function AnalyticsDashboard({
  onFilterChange,
  filters: initialFilters,
}: AnalyticsDashboardProps) {
  // Internal filter state
  const [filters, setFilters] = React.useState<FilterState>(
    initialFilters ?? {
      period: "week",
      range: 30,
      trendPeriod: "week",
    },
  );

  // Notify parent of filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Analytics data queries
  const overviewQuery = useAnalyticsOverview();
  const timeseriesQuery = useAnalyticsTimeseries({
    period: filters.period,
    range: filters.range,
    customStartDate: filters.customStartDate,
    customEndDate: filters.customEndDate,
  });
  const statusDistributionQuery = useAnalyticsStatusDistribution();
  const timeSlotsQuery = useAnalyticsTimeSlots();
  const heatmapQuery = useAnalyticsHeatmap();
  const trendsQuery = useAnalyticsTrends({
    period: filters.trendPeriod,
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <AnalyticsFilters
        onFilterChange={handleFilterChange}
        isLoading={
          overviewQuery.isLoading ||
          timeseriesQuery.isLoading ||
          trendsQuery.isLoading
        }
      />

      {/* Key Metrics - Collapsible on mobile */}
      <Collapsible defaultOpen className="space-y-3">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
            <span className="text-sm font-medium">Key Metrics</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="collapsible-content expanded">
          <AnalyticsStatsGrid
            data={getData(overviewQuery.data)}
            isLoading={overviewQuery.isLoading}
            error={overviewQuery.isError}
            onRetry={overviewQuery.refetch}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Main Charts */}
      <div className="grid gap-4 sm:gap-6">
        {/* Time Series Chart - Full Width */}
        <Collapsible defaultOpen className="space-y-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
              <span className="text-sm font-medium">
                Appointments Over Time
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="collapsible-content expanded">
            <TimeSeriesChart
              data={getData(timeseriesQuery.data)}
              isLoading={timeseriesQuery.isLoading}
              error={timeseriesQuery.isError}
              onRetry={timeseriesQuery.refetch}
              period={filters.period}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Second Row - Status and Heatmap */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 charts-grid-2-col">
          <Collapsible className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                <span className="text-sm font-medium">Status Distribution</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content expanded">
              <StatusDistributionChart
                data={getData(statusDistributionQuery.data)}
                isLoading={statusDistributionQuery.isLoading}
                error={statusDistributionQuery.isError}
                onRetry={statusDistributionQuery.refetch}
              />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                <span className="text-sm font-medium">Weekly Heatmap</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content expanded">
              <AppointmentHeatmap
                data={getData(heatmapQuery.data)}
                isLoading={heatmapQuery.isLoading}
                error={heatmapQuery.isError}
                onRetry={heatmapQuery.refetch}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Third Row - Time Slots and Trends */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 charts-grid-2-col">
          <Collapsible className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                <span className="text-sm font-medium">
                  Appointments by Hour
                </span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content expanded">
              <TimeSlotsChart
                data={getData(timeSlotsQuery.data)}
                isLoading={timeSlotsQuery.isLoading}
                error={timeSlotsQuery.isError}
                onRetry={timeSlotsQuery.refetch}
              />
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="space-y-3">
            <CollapsibleTrigger asChild>
              <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                <span className="text-sm font-medium">Trend Comparison</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="collapsible-content expanded">
              <TrendComparisonChart
                data={getData(trendsQuery.data)}
                isLoading={trendsQuery.isLoading}
                error={trendsQuery.isError}
                onRetry={trendsQuery.refetch}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
