"use client";

import { MapPin, Video } from "lucide-react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { DatePickerTime } from "@/components/ui/date-picker";


// ============================================
// Types
// ============================================

export type AppointmentFormValues = {
  title: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  meetingUrl?: string;
  emailNotification?: boolean;
};

interface AppointmentFormUIProps {
  isPending?: boolean;
  isEditing?: boolean;
  onCancel?: () => void;
  onSubmit?: (values: AppointmentFormValues) => void;
  submitLabel?: string;
}

// ============================================
// Component
// ============================================

export function AppointmentFormUI({
  isPending = false,
  isEditing = false,
  onCancel,
  onSubmit,
  submitLabel,
}: AppointmentFormUIProps) {
  const form = useFormContext<AppointmentFormValues>();
  const { setValue, control } = form;

  // Wrap handleSubmit for proper typing
  const handleFormSubmit = form.handleSubmit((values) => {
    onSubmit?.(values);
  });

  // Watch form values for date fields
  const watchStartDateTime = form.watch("startDateTime");
  const watchEndDateTime = form.watch("endDateTime");

  // Derive date values from form watch
  const startDate = watchStartDateTime
    ? new Date(watchStartDateTime)
    : undefined;
  const endDate = watchEndDateTime ? new Date(watchEndDateTime) : undefined;

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
              message: "Must be a valid URL starting with http:// or https://",
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="emailNotification"
          control={control}
          render={({ field }) => (
            <Field>
              <div className="flex items-center justify-between">
                <FieldLabel htmlFor={field.name}>Email Notification</FieldLabel>
                <Switch
                  id={field.name}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isPending}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Send an email reminder to the attendee
              </p>
            </Field>
          )}
        />
      </FieldGroup>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : submitLabel || (isEditing ? "Update" : "Create")}
        </Button>
      </div>
    </form>
  );
}
