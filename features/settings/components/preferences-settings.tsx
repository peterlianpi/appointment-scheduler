"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Bell, Loader2 } from "lucide-react";
import { REMINDER_TIME_OPTIONS } from "@/features/preferences/api/use-preferences";
import { LocalPreferences } from "../hooks/use-settings";

interface PreferencesSettingsProps {
  localPrefs: LocalPreferences;
  isLoadingPrefs: boolean;
  isSaving: boolean;
  onPreferenceChange: (
    key: keyof LocalPreferences,
    value: boolean | number,
  ) => void;
  onSave: () => void;
}

export function PreferencesSettings({
  localPrefs,
  isLoadingPrefs,
  isSaving,
  onPreferenceChange,
  onSave,
}: PreferencesSettingsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3">
        <Bell className="h-5 w-5" />
        <div>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Configure how you receive notifications
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive appointment reminders via email
            </p>
          </div>
          <Switch
            checked={localPrefs.emailReminders}
            onCheckedChange={(checked) =>
              onPreferenceChange("emailReminders", checked)
            }
            disabled={isLoadingPrefs}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Browser Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show push notifications in your browser
            </p>
          </div>
          <Switch
            checked={localPrefs.inAppReminders}
            onCheckedChange={(checked) =>
              onPreferenceChange("inAppReminders", checked)
            }
            disabled={isLoadingPrefs}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Appointment Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get reminded before scheduled appointments
            </p>
          </div>
          <Switch
            checked={localPrefs.reminderEnabled}
            onCheckedChange={(checked) =>
              onPreferenceChange("reminderEnabled", checked)
            }
            disabled={isLoadingPrefs}
          />
        </div>
        {localPrefs.reminderEnabled && (
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Remind me before</Label>
            <NativeSelect
              id="reminderTime"
              value={localPrefs.reminderHoursBefore.toString()}
              onChange={(e) =>
                onPreferenceChange(
                  "reminderHoursBefore",
                  parseInt(e.target.value),
                )
              }
              disabled={isLoadingPrefs}
            >
              {REMINDER_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        <Button onClick={onSave} disabled={isLoadingPrefs || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Notification Settings"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
