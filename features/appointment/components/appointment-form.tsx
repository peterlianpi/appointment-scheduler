"use client";

import { useEffect } from "react";
import { MapPin, Video } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Appointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointment/api/use-appointments";
import { DatePickerTime } from "@/components/ui/date-picker";

type AppointmentFormValues = {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  meetingUrl?: string;
  emailNotification?: boolean;
};

// ============================================
// Types
// ============================================

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment | null;
  onSuccess?: () => void;
}

// ============================================
// Component
// ============================================

export function AppointmentForm({
  open,
  onOpenChange,
  appointment,
  onSuccess,
}: AppointmentFormProps) {
  const isEditing = !!appointment;
  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<AppointmentFormValues>({
    defaultValues: {
      title: "",
      description: "",
      startDateTime: "",
      endDateTime: "",
      location: "",
      meetingUrl: "",
      emailNotification: false,
    },
  });

  const {
    setValue,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = form;

  // Watch form values for date fields
  const watchStartDateTime = watch("startDateTime");
  const watchEndDateTime = watch("endDateTime");

  // Derive date values from form watch
  const startDate = watchStartDateTime
    ? new Date(watchStartDateTime)
    : undefined;
  const endDate = watchEndDateTime ? new Date(watchEndDateTime) : undefined;

  // Reset form when appointment changes or dialog opens
  useEffect(() => {
    if (open) {
      if (appointment) {
        reset({
          title: appointment.title,
          description: appointment.description || "",
          startDateTime: appointment.startDateTime,
          endDateTime: appointment.endDateTime,
          location: appointment.location || "",
          meetingUrl: appointment.meetingUrl || "",
          emailNotification: appointment.emailNotificationSent,
        });
      } else {
        // Reset to defaults when opening for create
        reset({
          title: "",
          description: "",
          startDateTime: "",
          endDateTime: "",
          location: "",
          meetingUrl: "",
          emailNotification: false,
        });
      }
    }
  }, [appointment, open, reset]);

  // Helper function to format datetime to ISO 8601 format
  const formatDateTime = (value: string): string => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString();
  };

  const onSubmit = async (values: unknown) => {
    const formValues = values as {
      title: string;
      description?: string;
      startDateTime: string;
      endDateTime: string;
      location?: string;
      meetingUrl?: string;
      emailNotification?: boolean;
    };

    // Format datetime values to ISO 8601 before sending to API
    const formattedStartDateTime = formatDateTime(formValues.startDateTime);
    const formattedEndDateTime = formatDateTime(formValues.endDateTime);

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: appointment!.id,
          title: formValues.title,
          description: formValues.description,
          startDateTime: formattedStartDateTime,
          endDateTime: formattedEndDateTime,
          location: formValues.location,
          meetingUrl: formValues.meetingUrl,
          emailNotification: formValues.emailNotification ?? false,
        });
      } else {
        await createMutation.mutateAsync({
          title: formValues.title,
          description: formValues.description,
          startDateTime: formattedStartDateTime,
          endDateTime: formattedEndDateTime,
          location: formValues.location,
          meetingUrl: formValues.meetingUrl,
          emailNotification: formValues.emailNotification ?? false,
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      // Error is handled by the mutation hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full my-4 h-full overflow-y-auto">
        <DialogHeader className="relative pr-10">
          <DialogTitle className="text-lg sm:text-xl">
            {isEditing ? "Edit Appointment" : "Create Appointment"}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isEditing
              ? "Update the appointment details below."
              : "Fill in the details to create a new appointment."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FieldGroup className="space-y-4">
            <Controller
              name="title"
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="Meeting with John"
                    disabled={isPending}
                    aria-invalid={fieldState.invalid}
                    className="h-11 sm:h-10"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    placeholder="Meeting notes or agenda..."
                    disabled={isPending}
                    className="min-h-20 sm:min-h-25"
                  />
                </Field>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePickerTime
                label="Start Date"
                timeLabel="Start Time"
                value={startDate}
                onChange={(date) => {
                  if (date) {
                    setValue("startDateTime", date.toISOString());
                  } else {
                    setValue("startDateTime", "");
                  }
                }}
              />
              <DatePickerTime
                label="End Date"
                timeLabel="End Time"
                value={endDate}
                onChange={(date) => {
                  if (date) {
                    setValue("endDateTime", date.toISOString());
                  } else {
                    setValue("endDateTime", "");
                  }
                }}
              />
            </div>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Location</FieldLabel>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="123 Main St, City"
                      className="pl-9 h-11 sm:h-10"
                      disabled={isPending}
                    />
                  </div>
                </Field>
              )}
            />
            <Controller
              name="meetingUrl"
              control={control}
              rules={{
                pattern: {
                  value: /^https?:\/\//,
                  message:
                    "Must be a valid URL starting with http:// or https://",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    Meeting URL (Optional)
                  </FieldLabel>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="https://zoom.us/j/123456789"
                      className="pl-9 h-11 sm:h-10"
                      disabled={isPending}
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="emailNotification"
              control={control}
              render={({ field }) => (
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor={field.name}>
                      Email Notification
                    </FieldLabel>
                    <Switch
                      id={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </div>
                  <FieldDescription>
                    Send an email reminder to the attendee
                  </FieldDescription>
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter className="sm:justify-start gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
