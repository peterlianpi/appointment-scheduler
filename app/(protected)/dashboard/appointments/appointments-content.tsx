"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentList } from "@/features/appointment/components/appointment-list";
import {
  Appointment,
  AppointmentStatus,
} from "@/features/appointment/api/use-appointments";
import { AppointmentDetail } from "@/features/appointment/components/appointment-detail";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AppointmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  // Initialize state from URL params
  const initialStatus = searchParams.get("status") as
    | AppointmentStatus
    | "all"
    | null;
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialSearch = searchParams.get("search") || "";

  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<AppointmentStatus | "all">(
    initialStatus || "all",
  );
  const [search, setSearch] = useState(initialSearch);

  const handleCreate = () => {
    router.push("/dashboard/appointments/new");
  };

  const handleEdit = (appointment: Appointment) => {
    router.push(`/dashboard/appointments/${appointment.id}`);
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setViewMode("detail");
  };

  const handleDetailClose = () => {
    setSelectedAppointmentId(null);
    setViewMode("list");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as AppointmentStatus | "all");
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page Header - Mobile-first responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Manage and view all your appointments
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">New Appointment</span>
          <span className="sm:hidden">New</span>
        </Button>
      </div>

      {/* Toolbar - Mobile-first responsive */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search appointments..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Tabs */}
        <Tabs value={status} onValueChange={handleStatusChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {statusTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="min-w-20"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {viewMode === "list" ? (
          <AppointmentList
            onEdit={handleEdit}
            onView={handleView}
            showFilters={false}
            status={status}
            page={page}
            search={search}
            onStatusChange={handleStatusChange}
            onPageChange={setPage}
            onSearchChange={handleSearch}
          />
        ) : (
          <AppointmentDetail
            appointmentId={selectedAppointmentId}
            onClose={handleDetailClose}
            onEdit={(apt) => {
              setViewMode("list");
              handleEdit(apt);
            }}
          />
        )}
      </div>
    </div>
  );
}
