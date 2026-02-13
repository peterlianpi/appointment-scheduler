"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  Download,
  Users,
  Settings,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AppointmentList } from "@/features/appointment/components/appointment-list";
import { AppointmentFormWrapper } from "@/features/appointment/components/appointment-form-wrapper";
import { Appointment } from "@/features/appointment/api/use-appointments";
import {
  useAdminStats,
  useExportAppointments,
} from "@/features/admin/api/use-admin-stats";
import { useSendReminder } from "@/features/admin/api/use-admin-actions";
import { analyticsKeys } from "@/features/analytics/api/use-analytics";
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("analytics");
  const [showForm, setShowForm] = React.useState(false);
  const [editingAppointment, setEditingAppointment] =
    React.useState<Appointment | null>(null);
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useAdminStats();
  const exportMutation = useExportAppointments();
  const reminderMutation = useSendReminder();

  // Export state
  const [exportFormat, setExportFormat] = React.useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  // Analytics filters state
  const [filters, setFilters] = React.useState<FilterState>({
    period: "week",
    range: 30,
    trendPeriod: "week",
  });

  // Analytics data queries
  const overviewQuery = useAnalyticsOverview();
  const timeseriesQuery = useAnalyticsTimeseries({
    period: filters.period,
    range: filters.range,
  });
  const statusDistributionQuery = useAnalyticsStatusDistribution();
  const timeSlotsQuery = useAnalyticsTimeSlots();
  const heatmapQuery = useAnalyticsHeatmap();
  const trendsQuery = useAnalyticsTrends({
    period: filters.trendPeriod,
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  // CSV Export functionality
  const handleExport = async () => {
    try {
      exportMutation.mutate({
        format: exportFormat,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export appointments. Please try again.");
    }
  };

  // Send reminder functionality
  const handleSendReminder = (appointmentId: string) => {
    reminderMutation.mutate(appointmentId);
  };

  // Refresh analytics data
  const refreshAnalytics = () => {
    queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
  };

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-0 overflow-x-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Admin Dashboard
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Manage appointments and view analytics
              </p>
            </div>
            <TabsList className="touch-target">
              <TabsTrigger
                value="analytics"
                className="gap-2 touch-target px-3 sm:px-4"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="appointments"
                className="gap-2 touch-target px-3 sm:px-4"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">Appointments</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Analytics Tab */}
          <TabsContent
            value="analytics"
            className="mt-4 sm:mt-6 space-y-4 sm:space-y-6"
          >
            {/* Filters */}
            <AnalyticsFilters
              onFilterChange={setFilters}
              onRefresh={refreshAnalytics}
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
                  data={overviewQuery.data}
                  isLoading={overviewQuery.isLoading}
                  error={overviewQuery.isError}
                  onRetry={overviewQuery.refetch}
                />
              </CollapsibleContent>
            </Collapsible>

            {/* Main Charts */}
            <div className="grid gap-4 sm:gap-6">
              {/* Time Series Chart - Full Width */}
              <Collapsible defaultOpen className="space-3">
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
                    data={timeseriesQuery.data}
                    isLoading={timeseriesQuery.isLoading}
                    error={timeseriesQuery.isError}
                    onRetry={timeseriesQuery.refetch}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Second Row - Status and Heatmap */}
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 charts-grid-2-col">
                <Collapsible className="space-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                      <span className="text-sm font-medium">
                        Status Distribution
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content expanded">
                    <StatusDistributionChart
                      data={statusDistributionQuery.data}
                      isLoading={statusDistributionQuery.isLoading}
                      error={statusDistributionQuery.isError}
                      onRetry={statusDistributionQuery.refetch}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible className="space-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                      <span className="text-sm font-medium">
                        Weekly Heatmap
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content expanded">
                    <AppointmentHeatmap
                      data={heatmapQuery.data}
                      isLoading={heatmapQuery.isLoading}
                      error={heatmapQuery.isError}
                      onRetry={heatmapQuery.refetch}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              {/* Third Row - Time Slots and Trends */}
              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 charts-grid-2-col">
                <Collapsible className="space-3">
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
                      data={timeSlotsQuery.data}
                      isLoading={timeSlotsQuery.isLoading}
                      error={timeSlotsQuery.isError}
                      onRetry={timeSlotsQuery.refetch}
                    />
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible className="space-3">
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors touch-target">
                      <span className="text-sm font-medium">
                        Trend Comparison
                      </span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="collapsible-content expanded">
                    <TrendComparisonChart
                      data={trendsQuery.data}
                      isLoading={trendsQuery.isLoading}
                      error={trendsQuery.isError}
                      onRetry={trendsQuery.refetch}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </div>
          </TabsContent>

          {/* Appointments Management Tab */}
          <TabsContent value="appointments" className="mt-6">
            {/* Admin Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatsCard
                title="Total Users"
                value={stats?.data.totalUsers ?? 0}
                description="Active users in system"
                icon={Users}
                isLoading={statsLoading}
                error={!!statsError}
              />
              <StatsCard
                title="Total Appointments"
                value={stats?.data.totalAppointments ?? 0}
                description="All appointments"
                icon={Calendar}
                isLoading={statsLoading}
                error={!!statsError}
              />
              <StatsCard
                title="Upcoming Appointments"
                value={stats?.data.upcomingAppointments ?? 0}
                description="Scheduled appointments"
                icon={Calendar}
                isLoading={statsLoading}
                error={!!statsError}
              />
              <StatsCard
                title="Completed Appointments"
                value={stats?.data.completedAppointments ?? 0}
                description="Completed appointments"
                icon={Settings}
                isLoading={statsLoading}
                error={!!statsError}
              />
            </div>

            {/* Admin Content */}
            <div className="flex-1 rounded-xl bg-muted/50 md:min-h-min">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Appointment Management
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Manage, export, and create appointments
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Date Range */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        placeholder="Start Date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full sm:w-40"
                      />
                      <span className="text-muted-foreground hidden sm:inline">
                        to
                      </span>
                      <Input
                        type="date"
                        placeholder="End Date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full sm:w-40"
                      />
                    </div>
                    {/* Format Select */}
                    <Select
                      value={exportFormat}
                      onValueChange={(value) =>
                        setExportFormat(value as "csv" | "json")
                      }
                    >
                      <SelectTrigger className="w-full sm:w-32">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    {/* Export Button */}
                    <Button
                      variant="outline"
                      onClick={handleExport}
                      disabled={exportMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {exportMutation.isPending ? "Exporting..." : "Export"}
                    </Button>
                    {/* Create Button */}
                    <Button
                      onClick={() => setShowForm(true)}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create
                    </Button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* All Appointments Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      All Appointments
                    </h3>
                    <AppointmentList
                      onEdit={handleEdit}
                      onView={(apt) => console.log("View", apt)}
                      onSendReminder={handleSendReminder}
                      isSendingReminder={reminderMutation.isPending}
                      showFilters={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentFormWrapper
        open={showForm}
        onOpenChange={setShowForm}
        appointment={editingAppointment}
        onSuccess={handleFormSuccess}
      />
    </>
  );
}

// Simple StatsCard component inline for the appointments tab
function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
  error,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
  error?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="h-8 w-24 animate-pulse bg-muted rounded mt-1" />
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
          <span className="text-sm font-medium">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold text-red-500">Error</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium">{title}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
