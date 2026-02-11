"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  MoreHorizontal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Appointment,
  useAppointments,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
  AppointmentStatus,
} from "@/features/appointment/api/use-appointments";

interface AppointmentListProps {
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  showFilters?: boolean;
  userId?: string;
  // Controlled state props
  status?: AppointmentStatus | "all";
  page?: number;
  search?: string;
  onStatusChange?: (status: AppointmentStatus | "all") => void;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
}

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  NO_SHOW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function AppointmentList({
  onEdit,
  onView,
  showFilters = true,
  userId,
  status: controlledStatus,
  page: controlledPage,
  search: controlledSearch,
  onStatusChange,
  onPageChange,
  onSearchChange,
}: AppointmentListProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalStatus, setInternalStatus] = useState<
    AppointmentStatus | "all"
  >("all");
  const [internalPage, setInternalPage] = useState(1);
  const [internalSearch, setInternalSearch] = useState("");

  const status =
    controlledStatus !== undefined ? controlledStatus : internalStatus;
  const page = controlledPage !== undefined ? controlledPage : internalPage;
  const search =
    controlledSearch !== undefined ? controlledSearch : internalSearch;
  const limit = 10;

  const setStatus = (value: AppointmentStatus | "all") => {
    if (onStatusChange) {
      onStatusChange(value);
    } else {
      setInternalStatus(value);
    }
    // Reset page when status changes
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

  const setSearchValue = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearch(value);
    }
    // Reset page when search changes
    if (onPageChange) {
      onPageChange(1);
    } else {
      setInternalPage(1);
    }
  };

  const { data, isLoading, error, refetch } = useAppointments({
    page,
    limit,
    status: status === "all" ? undefined : (status as AppointmentStatus),
    search: search || undefined,
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
    newStatus: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) => {
    updateStatus({ id, input: { status: newStatus } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      deleteAppointment(id);
    }
  };

  const totalPages = meta?.totalPages || 1;

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search appointments..."
              value={search}
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={status}
              onValueChange={(value: AppointmentStatus | "all") => {
                setStatus(value);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="NO_SHOW">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
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
                {appointments.map((appointment: Appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{appointment.title}</p>
                        {appointment.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {appointment.description}
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
                      <Badge className={statusColors[appointment.status]}>
                        {appointment.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isUpdatingStatus || isDeleting}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onView?.(appointment)}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit?.(appointment)}
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {appointment.status === "SCHEDULED" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(
                                    appointment.id,
                                    "COMPLETED",
                                  )
                                }
                              >
                                Mark as completed
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(appointment.id, "NO_SHOW")
                                }
                              >
                                Mark as no show
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStatusChange(
                                    appointment.id,
                                    "CANCELLED",
                                  )
                                }
                                className="text-red-600"
                              >
                                Cancel appointment
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(appointment.id)}
                            className="text-red-600"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

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
            {search || status
              ? "Try adjusting your filters"
              : "Create your first appointment to get started"}
          </p>
        </div>
      )}
    </div>
  );
}
