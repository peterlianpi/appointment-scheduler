import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { client } from "@/lib/api/hono-client";
import type {
  Appointment,
  AppointmentStatus,
  UpdateAppointmentStatus,
  AppointmentListParams,
  AppointmentListResponse,
  AppointmentResponse,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateStatusInput,
  AppointmentStats,
} from "@/features/appointment/types";

// ============================================
// Query Keys
// ============================================

const appointmentKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentKeys.all, "list"] as const,
  list: (params: AppointmentListParams) =>
    [...appointmentKeys.lists(), params] as const,
  details: () => [...appointmentKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
};

// Re-export query keys for convenience
export { appointmentKeys };

// ============================================
// Queries
// ============================================

export function useAppointments(params: AppointmentListParams = {}) {
  return useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: async () => {
      const res = await client.api.appointment.$get({
        query: {
          page: params.page?.toString(),
          limit: params.limit?.toString(),
          status: params.status,
          statuses: params.statuses,
          search: params.search,
          searchFields: params.searchFields,
          startDate: params.startDate,
          endDate: params.endDate,
          dateRangeType: params.dateRangeType,
          userId: params.userId,
        },
      });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to fetch appointments",
          );
        }
        throw new Error("Failed to fetch appointments");
      }
      const data = await res.json();
      return data as AppointmentListResponse;
    },
  });
}

export function useAppointment(id: string | null) {
  return useQuery({
    queryKey: appointmentKeys.detail(id || ""),
    queryFn: async () => {
      if (!id) throw new Error("ID is required");
      const res = await client.api.appointment[":id"].$get({
        param: { id },
      });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to fetch appointment",
          );
        }
        throw new Error("Failed to fetch appointment");
      }
      const data = await res.json();
      return data as AppointmentResponse;
    },
    enabled: !!id,
  });
}

// ============================================
// Mutations
// ============================================

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAppointmentInput) => {
      const res = await client.api.appointment.$post({ json: input });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to create appointment",
          );
        }
        throw new Error("Failed to create appointment");
      }
      const data = await res.json();
      return data as AppointmentResponse;
    },
    onSuccess: () => {
      // Invalidate all appointment-related queries to ensure list refresh
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      toast.success("Appointment created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateAppointmentInput) => {
      const { id, ...body } = input;
      const res = await client.api.appointment[":id"].$put({
        param: { id },
        json: body,
      });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to update appointment",
          );
        }
        throw new Error("Failed to update appointment");
      }
      const data = await res.json();
      return data as AppointmentResponse;
    },
    onSuccess: () => {
      // Invalidate all appointment-related queries to ensure list refresh
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      toast.success("Appointment updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateStatusInput;
    }) => {
      const res = await client.api.appointment[":id"].status.$patch({
        param: { id },
        json: input,
      });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(error.error?.message || "Failed to update status");
        }
        throw new Error("Failed to update status");
      }
      const data = await res.json();
      return data as AppointmentResponse;
    },
    onSuccess: (_, { id }) => {
      // Invalidate all appointment-related queries to ensure list refresh
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.detail(id) });
      toast.success("Status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.appointment[":id"].$delete({
        param: { id },
      });
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to delete appointment",
          );
        }
        throw new Error("Failed to delete appointment");
      }
      const data = await res.json();
      return data as { success: boolean };
    },
    onSuccess: () => {
      // Invalidate all appointment-related queries to ensure list refresh
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      toast.success("Appointment deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// ============================================
// Stats
// ============================================

export function useAppointmentStats() {
  return useQuery({
    queryKey: [...appointmentKeys.all, "stats"],
    queryFn: async () => {
      const [scheduledRes, completedRes, cancelledRes, allRes] =
        await Promise.all([
          client.api.appointment.$get({
            query: { status: "SCHEDULED", limit: "1" },
          }),
          client.api.appointment.$get({
            query: { status: "COMPLETED", limit: "1" },
          }),
          client.api.appointment.$get({
            query: { status: "CANCELLED", limit: "1" },
          }),
          client.api.appointment.$get({ query: { limit: "1" } }),
        ]);

      const scheduled = await scheduledRes.json();
      const completed = await completedRes.json();
      const cancelled = await cancelledRes.json();
      const all = await allRes.json();

      const scheduledData = scheduled as AppointmentListResponse;
      const completedData = completed as AppointmentListResponse;
      const cancelledData = cancelled as AppointmentListResponse;
      const allData = all as AppointmentListResponse;

      return {
        total: allData.meta?.total || 0,
        upcoming: scheduledData.meta?.total || 0,
        completed: completedData.meta?.total || 0,
        cancelled: cancelledData.meta?.total || 0,
      } as AppointmentStats;
    },
  });
}

// Re-export types for backward compatibility
export type {
  Appointment,
  AppointmentStatus,
  UpdateAppointmentStatus,
  AppointmentListParams,
  AppointmentListResponse,
  AppointmentResponse,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  UpdateStatusInput,
  AppointmentStats,
} from "@/features/appointment/types";
