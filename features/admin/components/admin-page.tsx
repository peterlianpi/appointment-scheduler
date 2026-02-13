"use client";

import * as React from "react";
import { AnalyticsDashboard } from "@/features/analytics/analytics-dashboard";
import { AppointmentList } from "@/features/appointment/components/appointment-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, Calendar, Download } from "lucide-react";
import {
  useAdminStats,
  useExportAppointments,
} from "@/features/admin/api/use-admin-stats";

export function AdminPage() {
  const [activeTab, setActiveTab] = React.useState("analytics");
  const [exportFormat, setExportFormat] = React.useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const { data: stats } = useAdminStats();
  const exportMutation = useExportAppointments();

  const handleExport = () => {
    exportMutation.mutate({
      format: exportFormat,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Monitor appointments, track trends, and manage your scheduling data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      {stats?.success && stats.data && (
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Total
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.data.totalAppointments}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Upcoming
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.data.upcomingAppointments}
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Completion Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.data.completionRate.toFixed(1)}%
            </div>
          </div>
          <div className="p-3 sm:p-4 rounded-lg border bg-card">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Cancellation Rate
            </div>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.data.cancellationRate.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      {/* Export Controls (visible in both tabs) */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={exportFormat}
          onValueChange={(v) => setExportFormat(v as "csv" | "json")}
        >
          <SelectTrigger className="w-[90px] sm:w-[100px] touch-target min-h-[44px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="json">JSON</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-[130px] sm:w-[140px] touch-target"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-[130px] sm:w-[140px] touch-target"
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="touch-target min-h-[44px]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="appointments" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Appointments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="mt-0">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="appointments" className="mt-0">
          <AppointmentList showFilters={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
