"use client";

import { ActionCard } from "@/features/dashboard/components/action-card";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAppointmentStats } from "@/features/appointment/api/use-appointments";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useAppointmentStats();

  return (
    <div className="flex flex-1 flex-col gap-4 pt-0 p-0">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Appointments"
          value={statsLoading ? "..." : (stats?.total ?? 0)}
          description="All time appointments"
          icon={Calendar}
        />
        <StatsCard
          title="Upcoming"
          value={statsLoading ? "..." : (stats?.upcoming ?? 0)}
          description="Scheduled appointments"
          icon={Clock}
        />
        <StatsCard
          title="Completed"
          value={statsLoading ? "..." : (stats?.completed ?? 0)}
          description="Completed appointments"
          icon={CheckCircle}
        />
        <StatsCard
          title="Cancelled"
          value={statsLoading ? "..." : (stats?.cancelled ?? 0)}
          description="Cancelled appointments"
          icon={XCircle}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
          <p className="text-muted-foreground">
            Manage your appointments and settings
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          href="/dashboard/appointments"
          icon={Calendar}
          title="View All Appointments"
          description="See and manage all your appointments in one place"
          buttonText="View Appointments"
        />
        <ActionCard
          href="/dashboard/appointments?status=scheduled"
          icon={Clock}
          title="Upcoming Appointments"
          description="Check your scheduled appointments"
          buttonText="View Upcoming"
          iconColor="text-blue-500"
        />
        <ActionCard
          href="/dashboard/settings"
          icon={Calendar}
          title="Settings"
          description="Configure your account and preferences"
          buttonText="Open Settings"
        />
      </div>
    </div>
  );
}
