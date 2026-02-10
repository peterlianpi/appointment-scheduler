"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentList } from "@/components/appointment-list";
import {
  Appointment,
  AppointmentStatus,
  useAppointments,
} from "@/hooks/use-appointments";
import { AppointmentForm } from "@/components/appointment-form";
import { AppointmentDetail } from "@/components/appointment-detail";

const statusTabs = [
  { value: "all", label: "All" },
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
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

  const { data: _data } = useAppointments({
    page,
    limit: 10,
    status: status === "all" ? undefined : status,
    search: search || undefined,
  });

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleView = (appointment: Appointment) => {
    setSelectedAppointmentId(appointment.id);
    setViewMode("detail");
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAppointment(null);
  };

  const handleDetailClose = () => {
    setSelectedAppointmentId(null);
    setViewMode("list");
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingAppointment(null);
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
        <Button onClick={() => setShowForm(true)}>
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

     <div className="w-full">
       <AppointmentForm
        open={showForm}
        onOpenChange={setShowForm}
        appointment={editingAppointment}
        onSuccess={handleFormSuccess}
      />
     </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-50" />
              <Skeleton className="h-4 w-75" />
            </div>
            <Skeleton className="h-10 w-35" />
          </div>
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}
