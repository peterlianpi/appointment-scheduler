import { useQuery } from "@tanstack/react-query";
import { client, AdminStatsResponse } from "@/lib/api/hono-client";

// ============================================
// Query Keys
// ============================================

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => [...adminKeys.all, "stats"] as const,
};

// ============================================
// Queries
// ============================================

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const res = await client.api.admin.stats.$get();
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to fetch admin stats",
          );
        }
        throw new Error("Failed to fetch admin stats");
      }
      const data = await res.json();
      return data as AdminStatsResponse;
    },
  });
}
