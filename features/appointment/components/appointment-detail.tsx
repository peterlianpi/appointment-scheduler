"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  ExternalLink,
  Mail,
  Edit,
  Trash2,
  ArrowLeft,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Appointment,
  useAppointment,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from "@/features/appointment/api/use-appointments";

interface AppointmentDetailProps {
  appointmentId: string | null;
  onClose: () => void;
  onEdit?: (appointment: Appointment) => void;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  NO_SHOW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
};

export function AppointmentDetail({
  appointmentId,
  onClose,
  onEdit,
}: AppointmentDetailProps) {
  const { data, isLoading, error } = useAppointment(appointmentId);
  const updateStatus = useUpdateAppointmentStatus();
  const deleteMutation = useDeleteAppointment();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const appointment = data?.data;

  const handleStatusChange = (
    status: "COMPLETED" | "NO_SHOW" | "CANCELLED",
  ) => {
    if (appointmentId) {
      updateStatus.mutate({ id: appointmentId, input: { status } });
    }
  };

  const handleDelete = () => {
    if (appointmentId) {
      deleteMutation.mutate(appointmentId);
      setShowDeleteDialog(false);
      onClose();
    }
  };

  if (!appointmentId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[150px]" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">
          Failed to load appointment details
        </p>
        <Button variant="outline" onClick={onClose} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go back
        </Button>
      </div>
    );
  }

  const isScheduled = appointment.status === "SCHEDULED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{appointment.title}</h2>
            <Badge className={statusColors[appointment.status]}>
              {appointment.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onEdit?.(appointment)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date & Time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            </div>
            <p className="text-sm text-muted-foreground">
              Duration: {appointment.duration} minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.meetingUrl ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Video Call</span>
                </div>
                <a
                  href={appointment.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Join meeting
                </a>
              </div>
            ) : appointment.location ? (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{appointment.location}</span>
              </div>
            ) : (
              <p className="text-muted-foreground">No location set</p>
            )}
          </CardContent>
        </Card>
      </div>

      {appointment.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{appointment.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isScheduled && (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleStatusChange("COMPLETED")}
                disabled={updateStatus.isPending}
              >
                Mark as Completed
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("NO_SHOW")}
                disabled={updateStatus.isPending}
              >
                Mark as No Show
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={updateStatus.isPending}
              >
                Cancel Appointment
              </Button>
            </div>
          )}
          <Separator />
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <p>
              Created:{" "}
              {format(
                new Date(appointment.createdAt),
                "MMM d, yyyy 'at' h:mm a",
              )}
            </p>
            <p>
              Last updated:{" "}
              {format(
                new Date(appointment.updatedAt),
                "MMM d, yyyy 'at' h:mm a",
              )}
            </p>
            {appointment.emailNotificationSent && (
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                <span>Email notification sent</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this appointment? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
