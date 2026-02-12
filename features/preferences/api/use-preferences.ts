import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/api/hono-client";

export interface UserPreferences {
  // Notification settings
  reminderEnabled: boolean;
  reminderHoursBefore: number;
  emailReminders: boolean;
  inAppReminders: boolean;
  appointmentCreatedNotif: boolean;
  appointmentRescheduledNotif: boolean;
  appointmentCancelledNotif: boolean;
  // Appointment default settings
  defaultDuration: number;
  bufferTime: number;
}

// Response types
interface PreferencesResponseSuccess {
  success: true;
  data: UserPreferences;
}

interface PreferencesResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

type PreferencesResponse = PreferencesResponseSuccess | PreferencesResponseError;

export function useUserPreferences() {
  return useQuery<UserPreferences>({
    queryKey: ["user-preferences"],
    staleTime: 60 * 1000, // 1 minute
    queryFn: async () => {
      const response = await client.api.preferences.$get();
      if (!response.ok) {
        const errorData = (await response.json()) as PreferencesResponseError;
        throw new Error(errorData?.error?.message || "Failed to fetch preferences");
      }
      const data = (await response.json()) as PreferencesResponseSuccess;
      return data.data;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (preferences: Partial<UserPreferences>) => {
      const response = await client.api.preferences.$put({
        json: preferences,
      });
      if (!response.ok) {
        const errorData = (await response.json()) as PreferencesResponseError;
        throw new Error(errorData?.error?.message || "Failed to update preferences");
      }
      const data = (await response.json()) as PreferencesResponseSuccess;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-preferences"] });
    },
  });
}

// Reminder time options
export const REMINDER_TIME_OPTIONS = [
  { value: 1, label: "1 hour before" },
  { value: 2, label: "2 hours before" },
  { value: 6, label: "6 hours before" },
  { value: 12, label: "12 hours before" },
  { value: 24, label: "24 hours before (1 day)" },
  { value: 48, label: "48 hours before (2 days)" },
  { value: 72, label: "72 hours before (3 days)" },
];
