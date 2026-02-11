import { useQuery } from "@tanstack/react-query";
import { client, LandingPageResponse } from "@/lib/api/hono-client";

// ============================================
// Query Keys
// ============================================

export const landingKeys = {
  all: ["landing"] as const,
  data: () => [...landingKeys.all, "data"] as const,
};

// ============================================
// Queries
// ============================================

export function useLandingData() {
  return useQuery({
    queryKey: landingKeys.data(),
    queryFn: async () => {
      const res = await client.api.landing.$get();
      if (!res.ok) {
        const error = await res.json();
        if ("error" in error) {
          throw new Error(
            error.error?.message || "Failed to fetch landing data",
          );
        }
        throw new Error("Failed to fetch landing data");
      }
      const data = await res.json();
      return data as LandingPageResponse;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
