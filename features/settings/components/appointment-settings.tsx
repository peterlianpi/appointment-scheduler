"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Loader2 } from "lucide-react";

interface AppointmentSettingsProps {
  defaultDuration: number;
  bufferTime: number;
  isSavingAppointment: boolean;
  onDefaultDurationChange: (value: number) => void;
  onBufferTimeChange: (value: number) => void;
  onSave: () => void;
}

export function AppointmentSettings({
  defaultDuration,
  bufferTime,
  isSavingAppointment,
  onDefaultDurationChange,
  onBufferTimeChange,
  onSave,
}: AppointmentSettingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Calendar className="h-5 w-5" />
        <div>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Default settings for new appointments
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="defaultDuration">Default Duration (minutes)</Label>
          <Input
            id="defaultDuration"
            type="number"
            value={defaultDuration}
            onChange={(e) =>
              onDefaultDurationChange(parseInt(e.target.value) || 30)
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bufferTime">
            Buffer Between Appointments (minutes)
          </Label>
          <Input
            id="bufferTime"
            type="number"
            value={bufferTime}
            onChange={(e) => onBufferTimeChange(parseInt(e.target.value) || 5)}
          />
        </div>
        <Button onClick={onSave} disabled={isSavingAppointment}>
          {isSavingAppointment ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Appointment Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
