"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { updateProfileName, updateProfileEmail } from "@/action/profile";
import { useSessions } from "@/features/auth/hooks/use-sessions";
import {
  useUserPreferences,
  useUpdatePreferences,
} from "@/features/preferences/api/use-preferences";
import { toast } from "sonner";

export interface LocalPreferences {
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  emailReminders: boolean;
  inAppReminders: boolean;
  appointmentCreatedNotif: boolean;
  appointmentRescheduledNotif: boolean;
  appointmentCancelledNotif: boolean;
  defaultDuration: number;
  bufferTime: number;
}

const DEFAULT_PREFERENCES: LocalPreferences = {
  reminderEnabled: true,
  reminderHoursBefore: 24,
  emailReminders: true,
  inAppReminders: true,
  appointmentCreatedNotif: true,
  appointmentRescheduledNotif: true,
  appointmentCancelledNotif: true,
  defaultDuration: 30,
  bufferTime: 5,
};

export function useSettings() {
  const {
    data: session,
    isPending: isLoadingSession,
    refetch: refetchSession,
  } = useSession();
  const {
    sessions,
    isLoading: isLoadingSessions,
    refreshSessions,
    signOutSession,
    signOutAllDevices,
  } = useSessions();

  const { data: preferences, isLoading: isLoadingPrefs } = useUserPreferences();
  const updatePreferences = useUpdatePreferences();

  // UI State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAppointment, setIsSavingAppointment] = useState(false);

  // Local preferences state
  const [localPrefs, setLocalPrefs] =
    useState<LocalPreferences>(DEFAULT_PREFERENCES);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // Appointment settings state
  const [defaultDuration, setDefaultDuration] = useState(30);
  const [bufferTime, setBufferTime] = useState(5);

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs((prev) => ({
        ...prev,
        ...preferences,
      }));
    }
  }, [preferences]);

  // Sync profile form with session
  useEffect(() => {
    if (session?.user) {
      setFullName(session.user.name || "");
      setEmail(session.user.email || "");
    }
  }, [session]);

  // Preference handlers
  const handlePreferenceChange = (
    key: keyof LocalPreferences,
    value: boolean | number,
  ) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await updatePreferences.mutateAsync(localPrefs);
      toast.success("Preferences saved successfully");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // Update name if changed
      if (fullName !== session?.user?.name) {
        const result = await updateProfileName(fullName);
        if (!result.success) {
          throw new Error(result.error || "Failed to update name");
        }
      }

      // Update email if changed
      if (email !== session?.user?.email) {
        const result = await updateProfileEmail(email);
        if (!result.success) {
          throw new Error(result.error || "Failed to update email");
        }
      }

      toast.success("Profile updated successfully");
      await refetchSession();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAppointmentSettings = async () => {
    setIsSavingAppointment(true);
    try {
      // Save to preferences API
      await updatePreferences.mutateAsync({
        defaultDuration,
        bufferTime,
      });
      toast.success("Appointment settings saved successfully");
    } catch {
      toast.error("Failed to save appointment settings");
    } finally {
      setIsSavingAppointment(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSessions();
    setIsRefreshing(false);
  };

  const handleSignOutAll = async () => {
    const success = await signOutAllDevices();
    if (success) {
      // Redirect to login page
      window.location.href = "/login";
    }
  };

  return {
    // Session data
    session,
    isLoadingSession,
    sessions,
    isLoadingSessions,

    // Preferences
    preferences,
    isLoadingPrefs,
    localPrefs,
    defaultDuration,
    bufferTime,

    // UI State
    isRefreshing,
    isSaving,
    isSavingProfile,
    isSavingAppointment,

    // Profile state
    fullName,
    email,
    setFullName,
    setEmail,

    // Setters
    setDefaultDuration,
    setBufferTime,

    // Handlers
    handlePreferenceChange,
    handleSavePreferences,
    handleSaveProfile,
    handleSaveAppointmentSettings,
    handleRefresh,
    handleSignOutAll,
    signOutSession,
  };
}
