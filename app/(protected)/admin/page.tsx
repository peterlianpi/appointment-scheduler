"use client";

import { useState } from "react";
import { Plus, Calendar, Download, Users, Settings } from "lucide-react";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Button } from "@/components/ui/button";
import { AppointmentList } from "@/features/appointment/components/appointment-list";
import { AppointmentFormWrapper } from "@/features/appointment/components/appointment-form-wrapper";
import { Appointment } from "@/features/appointment/api/use-appointments";
import { useAdminStats } from "@/features/admin/api/use-admin-stats";

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const { data: stats, isLoading, error } = useAdminStats();

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  // CSV Export functionality
  const handleExport = async () => {
    try {
      const response = await fetch("/api/appointment/export");
      if (!response.ok) {
        throw new Error("Failed to export appointments");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointments-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export appointments. Please try again.");
    }
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  Admin Dashboard
                </h2>
                <p className="text-muted-foreground">
                  Manage all appointments and export data
                </p>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4" />
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
