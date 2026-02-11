"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
import {
  Appointment,
  useCreateAppointment,
  useUpdateAppointment,
} from "@/features/appointment/api/use-appointments";

// ============================================
// Zod Schema
// ============================================

const appointmentFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  startDateTime: z.string().min(1, "Start date and time is required"),
  endDateTime: z.string().min(1, "End date and time is required"),
  location: z.string().optional(),
  meetingUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  emailNotification: z.boolean().optional(),
});

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

  const form = useForm({
    resolver: zodResolver(appointmentFormSchema),
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
    watch,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = form;
  const startDateTime = watch("startDateTime");
  const endDateTime = watch("endDateTime");

  // Track if we were editing to handle reset properly
  const wasEditing = useRef(false);

  // Reset form when appointment changes or dialog opens with new appointment
  useEffect(() => {
    if (appointment) {
      wasEditing.current = true;
      reset({
        title: appointment.title,
        description: appointment.description || "",
        startDateTime: appointment.startDateTime,
        endDateTime: appointment.endDateTime,
        location: appointment.location || "",
        meetingUrl: appointment.meetingUrl || "",
        emailNotification: appointment.emailNotificationSent,
      });
    } else if (wasEditing.current) {
      // Only reset if we were previously editing (prevents reset on initial mount)
      wasEditing.current = false;
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
  }, [appointment, reset]);

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

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: appointment!.id,
          title: formValues.title,
          description: formValues.description,
          startDateTime: formValues.startDateTime,
          endDateTime: formValues.endDateTime,
          location: formValues.location,
          meetingUrl: formValues.meetingUrl,
          emailNotification: formValues.emailNotification ?? false,
        });
      } else {
        await createMutation.mutateAsync({
          title: formValues.title,
          description: formValues.description,
          startDateTime: formValues.startDateTime,
          endDateTime: formValues.endDateTime,
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

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      const time = startDateTime ? new Date(startDateTime) : new Date();
      date.setHours(time.getHours(), time.getMinutes());
      setValue("startDateTime", date.toISOString());
    } else {
      setValue("startDateTime", "");
    }
  };

  const handleStartTimeChange = (
    e: React.MouseEvent,
    hours: number,
    minutes: number,
  ) => {
    e.preventDefault();
    const current = startDateTime ? new Date(startDateTime) : new Date();
    current.setHours(hours, minutes);
    setValue("startDateTime", current.toISOString());
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      const time = endDateTime ? new Date(endDateTime) : new Date();
      date.setHours(time.getHours(), time.getMinutes());
      setValue("endDateTime", date.toISOString());
    } else {
      setValue("endDateTime", "");
    }
  };

  const handleEndTimeChange = (
    e: React.MouseEvent,
    hours: number,
    minutes: number,
  ) => {
    e.preventDefault();
    const current = endDateTime ? new Date(endDateTime) : new Date();
    current.setHours(hours, minutes);
    setValue("endDateTime", current.toISOString());
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        slots.push({ hours: h, minutes: m });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

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
            <div
              className="grid grid-cols-1 gap-4 w-full
             "
            >
              <Controller
                name="startDateTime"
                control={control}
                render={({ fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Start Date & Time</FieldLabel>
                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11 sm:h-10",
                              !startDateTime && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDateTime ? (
                              format(new Date(startDateTime), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              startDateTime
                                ? new Date(startDateTime)
                                : undefined
                            }
                            onSelect={handleStartDateSelect}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:w-20 h-11 sm:h-10"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-2 max-h-50 overflow-y-auto">
                            {timeSlots.map((slot) => (
                              <Button
                                key={`${slot.hours}-${slot.minutes}`}
                                variant="ghost"
                                size="sm"
                                className="text-xs h-9 sm:h-8"
                                onClick={(e) =>
                                  handleStartTimeChange(
                                    e,
                                    slot.hours,
                                    slot.minutes,
                                  )
                                }
                              >
                                {format(
                                  new Date(
                                    2024,
                                    0,
                                    1,
                                    slot.hours,
                                    slot.minutes,
                                  ),
                                  "HH:mm",
                                )}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="endDateTime"
                control={control}
                render={({ fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>End Date & Time</FieldLabel>
                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-11 sm:h-10",
                              !endDateTime && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDateTime ? (
                              format(new Date(endDateTime), "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              endDateTime ? new Date(endDateTime) : undefined
                            }
                            onSelect={handleEndDateSelect}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:w-20 h-11 sm:h-10"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0" align="start">
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-2 max-h-50 overflow-y-auto">
                            {timeSlots.map((slot) => (
                              <Button
                                key={`${slot.hours}-${slot.minutes}`}
                                variant="ghost"
                                size="sm"
                                className="text-xs h-9 sm:h-8"
                                onClick={(e) =>
                                  handleEndTimeChange(
                                    e,
                                    slot.hours,
                                    slot.minutes,
                                  )
                                }
                              >
                                {format(
                                  new Date(
                                    2024,
                                    0,
                                    1,
                                    slot.hours,
                                    slot.minutes,
                                  ),
                                  "HH:mm",
                                )}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
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
