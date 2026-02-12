"use client";

import { format } from "date-fns";
import { Calendar, Clock, MapPin, Video, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { AppointmentActionsDropdown } from "./appointment-actions-dropdown";
import { useState } from "react";
import {
  Appointment,
  AppointmentStatus,
} from "@/features/appointment/api/use-appointments";
import {
  statusColors,
  statusProgressConfig,
} from "@/features/appointment/constants/status-config";

interface AppointmentCardProps {
  appointment: Appointment;
  isLoading?: boolean;
  onEdit?: (appointment: Appointment) => void;
  onView?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  onDelete?: (id: string) => void;
}

export function AppointmentCard({
  appointment,
  isLoading = false,
  onEdit,
  onView,
  onStatusChange,
  onDelete,
}: AppointmentCardProps) {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isScheduled = appointment.status === "SCHEDULED";
  const isInProgress = appointment.status === "IN_PROGRESS";
  const statusConfig = statusProgressConfig[appointment.status];
  const StatusIcon = statusConfig.icon;

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusChange?.(id, status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(appointment.id);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewClick = () => {
    onView?.(appointment);
    setShowViewDialog(true);
  };

  const handleEditClick = () => {
    onEdit?.(appointment);
  };

  return (
    <>
      <Card className={cn("w-full", isLoading && "opacity-70")}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              {appointment.title}
            </CardTitle>
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
              {/* Progress indicator for scheduled appointments */}
              {isScheduled && isUpdatingStatus && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Spinner className="h-3 w-3" />
                  Updating...
                </span>
              )}
            </div>
          </div>
          <AppointmentActionsDropdown
            appointment={appointment}
            isUpdating={isUpdatingStatus}
            isDeleting={isDeleting}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onStatusChange={handleStatusChange}
            onDelete={(id) => {
              setShowDeleteDialog(true);
            }}
            variant="card"
          />
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
                    <span className="text-muted-foreground">
                      No location set
                    </span>
                  </>
                )}
              </div>
            </div>
            {/* Progress bar for scheduled/in-progress appointments */}
            {(isScheduled || isInProgress) && (
              <div className="mt-2">
                <Progress value={isInProgress ? 66 : 33} className="h-1" />
                <p className="mt-1 text-xs text-muted-foreground">
                  {isInProgress
                    ? "Appointment in progress"
                    : "Appointment scheduled"}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="w-80 max-w-125">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StatusIcon
                className={cn(
                  "h-5 w-5",
                  statusConfig.color,
                  isInProgress && "animate-spin",
                )}
              />
              {appointment.title}
            </DialogTitle>
            <DialogDescription>
              Appointment scheduled for{" "}
              {format(
                new Date(appointment.startDateTime),
                "EEEE, MMMM d, yyyy 'at' h:mm a",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Date
                </h4>
                <p className="text-sm">
                  {format(new Date(appointment.startDateTime), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Time
                </h4>
                <p className="text-sm">
                  {format(new Date(appointment.startDateTime), "h:mm a")} -{" "}
                  {format(new Date(appointment.endDateTime), "h:mm a")}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Duration
                </h4>
                <p className="text-sm">{appointment.duration} minutes</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Status
                </h4>
                <Badge className={statusColors[appointment.status]}>
                  {appointment.status.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {appointment.description && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Description
                </h4>
                <p className="text-sm">{appointment.description}</p>
              </div>
            )}

            {appointment.meetingUrl ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Location
                </h4>
                <a
                  href={appointment.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <Video className="h-4 w-4" />
                  Join Video Meeting
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : appointment.location ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">
                  Location
                </h4>
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {appointment.location}
                </p>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button onClick={handleEditClick}>Edit Appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
