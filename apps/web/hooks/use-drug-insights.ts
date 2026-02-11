import { useQuery } from "@tanstack/react-query";
import type { DrugInsights } from "@/lib/ai/drug-insights";

export function useDrugInsights(drugId: string | undefined) {
  return useQuery({
    queryKey: ["drug-insights", drugId],
    queryFn: async (): Promise<DrugInsights> => {
      if (!drugId) {
        throw new Error("Drug ID is required");
      }

      const response = await fetch(`/api/drugs/${drugId}/ai`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Drug not found");
        }
        throw new Error("Failed to fetch drug insights");
      }

      return response.json();
    },
    enabled: !!drugId,
    staleTime: 5 * 60 * 1000, // 5 minutes - React Query cache
    gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error instanceof Error && error.message === "Drug not found") {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
  });
}
