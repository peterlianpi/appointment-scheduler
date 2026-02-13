"use client";

import Link from "next/link";
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import {
  useAppointmentStats,
  useAppointments,
  useUpdateAppointmentStatus,
} from "@/features/appointment/api/use-appointments";
import type {
  AppointmentStatus,
  UpdateStatusInput,
} from "@/features/appointment/types";
import { AppointmentCard } from "@/features/appointment/components/appointment-card";
import { ActionCard } from "@/features/dashboard/components/action-card";
import { StatsCard } from "@/features/dashboard/components/stats-card";
import { Spinner } from "@/components/ui/spinner";
import { Empty, EmptyContent } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useAppointmentStats();
  const {
    data: appointmentsData,
    isLoading: appointmentsLoading,
    error,
  } = useAppointments({ dateRangeType: "upcoming", limit: 5 });
  const updateStatusMutation = useUpdateAppointmentStatus();

  type UpdateAppointmentStatus = UpdateStatusInput["status"];

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    updateStatusMutation.mutate({
      id,
      input: { status: status as UpdateAppointmentStatus },
    });
  };

  const unreadAppointments = appointmentsData?.data ?? [];
  const hasAppointments =
    !appointmentsLoading && !error && unreadAppointments.length > 0;

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

      {/* Upcoming Appointments Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Upcoming Appointments
            </h2>
            <p className="text-muted-foreground">
              Your next scheduled appointments
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link
              href="/appointments?status=scheduled"
              className="flex items-center gap-2"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Loading State */}
        {appointmentsLoading && (
          <div className="flex items-center justify-center py-12">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {/* Error State */}
        {!appointmentsLoading && error && (
          <Empty className="py-12">
            <EmptyContent>
              <p className="text-muted-foreground">
                Failed to load appointments
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try again later
              </p>
            </EmptyContent>
          </Empty>
        )}

        {/* Empty State */}
        {!appointmentsLoading &&
          !error &&
          (!appointmentsData?.data || appointmentsData.data.length === 0) && (
            <Empty className="py-12">
              <EmptyContent>
                <p className="text-muted-foreground">
                  No upcoming appointments
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Schedule a new appointment to get started
                </p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/appointments/new">Schedule Appointment</Link>
                </Button>
              </EmptyContent>
            </Empty>
          )}

        {/* Appointments Grid */}
        {hasAppointments && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unreadAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quick Actions</h2>
          <p className="text-muted-foreground">
            Manage your appointments and settings
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ActionCard
          href="/appointments"
          icon={Calendar}
          title="View All Appointments"
          description="See and manage all your appointments in one place"
          buttonText="View Appointments"
        />
        <ActionCard
          href="/appointments?status=scheduled"
          icon={Clock}
          title="Upcoming Appointments"
          description="Check your scheduled appointments"
          buttonText="View Upcoming"
          iconColor="text-blue-500"
        />
        <ActionCard
          href="/settings"
          icon={Calendar}
          title="Settings"
          description="Configure your account and preferences"
          buttonText="Open Settings"
        />
      </div>
    </div>
  );
}
