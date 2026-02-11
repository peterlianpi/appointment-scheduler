"use client";

import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Appointment, AppointmentStatus } from "@/hooks/use-appointments";

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onDelete?: (id: string) => void;
}

const statusColors: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  NO_SHOW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function AppointmentCard({
  appointment,
  onEdit,
  onView,
  onStatusChange,
  onDelete,
}: AppointmentCardProps) {
  const isScheduled = appointment.status === "SCHEDULED";

  const handleStatusChange = (status: AppointmentStatus) => {
    onStatusChange?.(appointment.id, status);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this appointment?")) {
      onDelete?.(appointment.id);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">
            {appointment.title}
          </CardTitle>
          <Badge className={statusColors[appointment.status]}>
            {appointment.status.replace("_", " ")}
          </Badge>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(appointment)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(appointment)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isScheduled && (
              <>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("COMPLETED")}
                >
                  Mark as completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("NO_SHOW")}>
                  Mark as no show
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("CANCELLED")}
                  className="text-red-600"
                >
                  Cancel appointment
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-red-600">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {appointment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {appointment.description}
            </p>
          )}
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(
                  new Date(appointment.startDateTime),
                  "EEEE, MMMM d, yyyy",
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {format(new Date(appointment.startDateTime), "h:mm a")} -{" "}
                {format(new Date(appointment.endDateTime), "h:mm a")}
              </span>
              <span className="text-muted-foreground">
                ({appointment.duration} min)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {appointment.meetingUrl ? (
                <>
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={appointment.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Join meeting
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : appointment.location ? (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{appointment.location}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">No location set</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
