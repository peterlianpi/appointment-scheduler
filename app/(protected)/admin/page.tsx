"use client";

import { useState } from "react";
import { Plus, Calendar, Download, Users, Settings } from "lucide-react";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppointmentList } from "@/features/appointment/components/appointment-list";
import { AppointmentFormWrapper } from "@/features/appointment/components/appointment-form-wrapper";
import { Appointment } from "@/features/appointment/api/use-appointments";
import {
  useAdminStats,
  useExportAppointments,
} from "@/features/admin/api/use-admin-stats";
import { useSendReminder } from "@/features/admin/api/use-admin-actions";

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const { data: stats, isLoading, error } = useAdminStats();
  const exportMutation = useExportAppointments();
  const reminderMutation = useSendReminder();

  // Export state
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

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

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-0">
        {/* Admin Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats?.data.totalUsers ?? 0}
            description="Active users in system"
            icon={Users}
            isLoading={isLoading}
            error={!!error}
          />
          <StatsCard
            title="Total Appointments"
            value={stats?.data.totalAppointments ?? 0}
            description="All appointments"
            icon={Calendar}
            isLoading={isLoading}
            error={!!error}
          />
          <StatsCard
            title="Upcoming Appointments"
            value={stats?.data.upcomingAppointments ?? 0}
            description="Scheduled appointments"
            icon={Calendar}
            isLoading={isLoading}
            error={!!error}
          />
          <StatsCard
            title="Completed Appointments"
            value={stats?.data.completedAppointments ?? 0}
            description="Completed appointments"
            icon={Settings}
            isLoading={isLoading}
            error={!!error}
          />
        </div>

        {/* Admin Content */}
        <div className="flex-1 rounded-xl bg-muted/50 md:min-h-min">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Admin Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Manage all appointments and export data
                </p>
                <div className="flex flex-wrap gap-2 pt-4">
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
            </div>

            <div className="space-y-6">
              {/* All Appointments Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">All Appointments</h3>
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
