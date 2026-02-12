"use client";

import { MoreHorizontal, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import {
  Appointment,
  UpdateAppointmentStatus,
} from "@/features/appointment/api/use-appointments";
import { cn } from "@/lib/utils";

interface AppointmentActionsDropdownProps {
  appointment: Appointment;
  isUpdating?: boolean;
  isDeleting?: boolean;
  isSendingReminder?: boolean;
  onView?: (appointment: Appointment) => void;
  onEdit?: (appointment: Appointment) => void;
  onStatusChange?: (id: string, status: UpdateAppointmentStatus) => void;
  onDelete?: (id: string) => void;
  onSendReminder?: (id: string) => void;
  variant?: "card" | "table";
}

export function AppointmentActionsDropdown({
  appointment,
  isUpdating = false,
  isDeleting = false,
  isSendingReminder = false,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onSendReminder,
  variant = "card",
}: AppointmentActionsDropdownProps) {
  const isScheduled = appointment.status === "SCHEDULED";
  const showReminderOption = !!onSendReminder && isScheduled && !appointment.reminderSent;

  const handleViewClick = () => {
    onView?.(appointment);
  };

  const handleEditClick = () => {
    onEdit?.(appointment);
  };

  const handleStatusChange = (status: UpdateAppointmentStatus) => {
    onStatusChange?.(appointment.id, status);
  };

  const handleDeleteClick = () => {
    onDelete?.(appointment.id);
  };

  const handleSendReminderClick = () => {
    onSendReminder?.(appointment.id);
  };

  const showStatusChangeOptions = isScheduled;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isUpdating || isDeleting}
          className={cn(variant === "table" && "ml-auto")}
        >
          {isDeleting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewClick}>
          View details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEditClick}>Edit</DropdownMenuItem>
        {showReminderOption && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSendReminderClick}
              disabled={isSendingReminder}
            >
              {isSendingReminder ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 animate-spin" />
                  Sending reminder...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Send Reminder
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
        {showStatusChangeOptions && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleStatusChange("COMPLETED")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Marking as completed...
                </>
              ) : (
                "Mark as completed"
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("NO_SHOW")}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Marking as no show...
                </>
              ) : (
                "Mark as no show"
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange("CANCELLED")}
              className="text-red-600"
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Cancelling...
                </>
              ) : (
                "Cancel appointment"
              )}
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDeleteClick}
          className="text-red-600"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            "Delete"
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
