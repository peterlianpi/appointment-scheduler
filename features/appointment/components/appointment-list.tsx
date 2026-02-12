"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import {
  Appointment,
  useAppointments,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
  AppointmentStatus,
  UpdateAppointmentStatus,
} from "@/features/appointment/api/use-appointments";
import { useDebouncedSearch } from "@/features/appointment/hooks/use-debounced-search";
import { AppointmentActionsDropdown } from "./appointment-actions-dropdown";
import {
  statusColors,
  statusProgressConfig,
  allStatuses,
} from "@/features/appointment/constants/status-config";

interface AppointmentListProps {
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  showFilters?: boolean;
  userId?: string;
  // Controlled state props (single status)
  status?: AppointmentStatus | "all";
  // Controlled state props (array of statuses)
  statuses?: string[];
  page?: number;
  search?: string;
  dateRangeType?: "upcoming" | "past" | "all";
  onStatusChange?: (status: AppointmentStatus | "all") => void;
  onStatusesChange?: (statuses: string[]) => void;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onDateRangeTypeChange?: (type: "upcoming" | "past" | "all") => void;
  // Admin reminder props
  onSendReminder?: (appointmentId: string) => void;
  isSendingReminder?: boolean;
}

export function AppointmentList({
  onEdit,
  onView,
  showFilters = true,
  userId,
  status,
  statuses: controlledStatuses,
  page: controlledPage,
  search: controlledSearch,
  dateRangeType: controlledDateRangeType,
  onStatusesChange,
  onPageChange,
  onSearchChange,
  onDateRangeTypeChange,
  onSendReminder,
  isSendingReminder,
}: AppointmentListProps) {
  // Use controlled statuses if provided, otherwise use internal state
  const [internalStatuses, setInternalStatuses] = useState<string[]>([]);
  const [internalPage, setInternalPage] = useState(1);
  const [internalDateRangeType, setInternalDateRangeType] = useState<
    "upcoming" | "past" | "all"
  >("all");

  // Debounced search
  const [debouncedSearch, setSearchInput, clearSearch, searchInput] =
    useDebouncedSearch(300);

  const router = useRouter();

  // Track action states for individual appointments
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
    null,
  );

  // Determine which status mode to use
  const hasControlledStatuses = controlledStatuses !== undefined;
  const hasControlledStatus = status !== undefined;

  // Use controlled status/s based on what's provided
  // Priority: controlledStatuses > controlledStatus > internalStatuses
  const statuses = hasControlledStatuses
    ? controlledStatuses
    : hasControlledStatus
      ? status === "all"
        ? []
        : [status]
      : internalStatuses;
  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const dateRangeType =
    controlledDateRangeType !== undefined
      ? controlledDateRangeType
      : internalDateRangeType;
  const search =
    controlledSearch !== undefined ? controlledSearch : debouncedSearch;

  const limit = 10;

  const setStatuses = (value: string[]) => {
    if (onStatusesChange) {
      onStatusesChange(value);
    } else {
      setInternalStatuses(value);
    }
    // Reset page when filters change
    if (onPageChange) {
      onPageChange(1);
    } else {
      setInternalPage(1);
    }
  };

  const setPageValue = (newPage: number) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalPage(newPage);
    }
  };

  const setDateRangeType = (value: "upcoming" | "past" | "all") => {
    if (onDateRangeTypeChange) {
      onDateRangeTypeChange(value);
    } else {
      setInternalDateRangeType(value);
    }
    if (onPageChange) {
      onPageChange(1);
    } else {
      setInternalPage(1);
    }
  };

  const { data, isLoading, error, refetch } = useAppointments({
    page,
    limit,
    statuses: statuses.length > 0 ? statuses.join(",") : undefined,
    search: search || undefined,
    dateRangeType,
    userId,
  });

  const appointments = data?.data ?? [];
  const meta = data?.meta;

  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateAppointmentStatus();
  const { mutate: deleteAppointment, isPending: isDeleting } =
    useDeleteAppointment();

  const handleStatusChange = (
    id: string,
    newStatus: UpdateAppointmentStatus,
  ) => {
    setUpdatingStatusId(id);
    updateStatus({ id, input: { status: newStatus } });
  };

  const handleDeleteClick = (id: string) => {
    setAppointmentToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (appointmentToDelete) {
      setDeletingId(appointmentToDelete);
      deleteAppointment(appointmentToDelete);
    }
  };

  const handleViewClick = (appointment: Appointment) => {
    onView?.(appointment);
    router.push(`/appointments/${appointment.id}`);
  };

  const handleEditClick = (appointment: Appointment) => {
    onEdit?.(appointment);
  };

  const toggleStatus = (status: string) => {
    const newStatuses = statuses.includes(status)
      ? statuses.filter((s) => s !== status)
      : [...statuses, status];
    setStatuses(newStatuses);
  };

  const selectAllStatuses = () => {
    setStatuses([...allStatuses]);
  };

  const clearAllStatuses = () => {
    setStatuses([]);
  };

  const totalPages = meta?.totalPages || 1;
  const hasActiveFilters =
    search || statuses.length > 0 || dateRangeType !== "all";

  // Reset action states when appointments change
  useState(() => {
    if (!isUpdatingStatus && !isDeleting) {
      setUpdatingStatusId(null);
      setDeletingId(null);
    }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">Failed to load appointments</p>
        <Button variant="outline" onClick={() => refetch()} className="mt-4">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search appointments by title, description, or location..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (onSearchChange) {
                  onSearchChange(e.target.value);
                }
              }}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                onClick={() => {
                  clearSearch();
                  if (onSearchChange) {
                    onSearchChange("");
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              {/* Date Range Quick Filters */}
              <Select
                value={dateRangeType}
                onValueChange={(value: "upcoming" | "past" | "all") => {
                  setDateRangeType(value);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Multi-Select */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-35 justify-between"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    {statuses.length === 0
                      ? "All statuses"
                      : statuses.length === allStatuses.length
                        ? "All selected"
                        : `${statuses.length} selected`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-50" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Filter by status
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllStatuses}
                          className="h-6 px-2 text-xs"
                        >
                          Select all
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllStatuses}
                          className="h-6 px-2 text-xs"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {allStatuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={statuses.includes(status)}
                            onCheckedChange={() => toggleStatus(status)}
                          />
                          <label
                            htmlFor={`status-${status}`}
                            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {status.charAt(0) +
                              status.slice(1).toLowerCase().replace("_", " ")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearSearch();
                    setStatuses([]);
                    setDateRangeType("all");
                    if (onSearchChange) onSearchChange("");
                    if (onStatusesChange) onStatusesChange([]);
                    if (onDateRangeTypeChange) onDateRangeTypeChange("all");
                  }}
                  className="text-muted-foreground"
                  aria-label="Clear all filters"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear filters
                </Button>
              )}
            </div>

            {/* Results Count */}
            {meta?.total !== undefined && (
              <div className="text-sm text-muted-foreground">
                {meta.total} {meta.total === 1 ? "appointment" : "appointments"}
                {search && (
                  <span className="ml-1">for &ldquo;{search}&rdquo;</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-62.5" />
                <Skeleton className="h-4 w-50" />
              </div>
            </div>
          ))}
        </div>
      ) : appointments.length > 0 ? (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment: Appointment) => {
                  const statusConfig = statusProgressConfig[appointment.status];
                  const StatusIcon = statusConfig.icon;
                  const isUpdating = updatingStatusId === appointment.id;
                  const isDeleting = deletingId === appointment.id;
                  const isScheduled = appointment.status === "SCHEDULED";
                  const isInProgress = appointment.status === "IN_PROGRESS";

                  return (
                    <TableRow
                      key={appointment.id}
                      className={cn(isUpdating && "opacity-70")}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{appointment.title}</p>
                          {appointment.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {appointment.description}
                            </p>
                          )}
                          {appointment.user && (
                            <p className="text-xs text-muted-foreground">
                              {appointment.user.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>
                              {format(
                                new Date(appointment.startDateTime),
                                "MMM d, yyyy",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>
                              {format(
                                new Date(appointment.startDateTime),
                                "h:mm a",
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(appointment.endDateTime),
                                "h:mm a",
                              )}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {appointment.meetingUrl ? (
                            <>
                              <Video className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Video Call</span>
                            </>
                          ) : appointment.location ? (
                            <>
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                {appointment.location}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              -
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[appointment.status]}>
                            <StatusIcon
                              className={cn(
                                "mr-1 h-3 w-3",
                                statusConfig.color,
                                isInProgress && "animate-spin",
                              )}
                            />
                            {appointment.status.replace("_", " ")}
                          </Badge>
                          {isInProgress && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                          {isUpdating && (
                            <span className="flex items-center gap-1">
                              <Spinner className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <AppointmentActionsDropdown
                          appointment={appointment}
                          isUpdating={isUpdating}
                          isDeleting={isDeleting}
                          isSendingReminder={isSendingReminder}
                          onView={handleViewClick}
                          onEdit={handleEditClick}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDeleteClick}
                          onSendReminder={onSendReminder}
                          variant="table"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                \
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to{" "}
                {Math.min(page * limit, meta?.total || 0)} of {meta?.total || 0}{" "}
                <span className="hidden sm:inline">appointments</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageValue(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setPageValue(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageValue(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No appointments found</p>
          <p className="text-muted-foreground">
            {hasActiveFilters
              ? "Try adjusting your filters"
              : "Create your first appointment to get started"}
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={!!deletingId}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
