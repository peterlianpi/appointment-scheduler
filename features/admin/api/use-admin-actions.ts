import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { sendReminder } from "@/lib/api/hono-client";

/**
 * Hook for sending appointment reminders (Admin only)
 */
export function useSendReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      await sendReminder({ appointmentId });
    },
    onSuccess: () => {
      toast.success("Reminder sent successfully");
      // Invalidate appointment queries to update reminder status
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send reminder");
    },
  });
}
