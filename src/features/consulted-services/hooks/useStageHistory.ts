// src/features/consulted-services/hooks/useStageHistory.ts
import { useQuery } from "@tanstack/react-query";
import type { StageHistoryResponse } from "@/shared/validation/consulted-service.schema";

/**
 * Fetch stage history for a consulted service
 */
async function getStageHistoryApi(consultedServiceId: string) {
  const res = await fetch(
    `/api/v1/consulted-services/${consultedServiceId}/stage-history`
  );

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.message || "Không thể lấy lịch sử stage");
  }

  const json = await res.json();
  return json as { items: StageHistoryResponse[]; count: number };
}

/**
 * Hook to get stage history for a consulted service
 */
export function useStageHistory(consultedServiceId: string) {
  return useQuery({
    queryKey: ["stage-history", consultedServiceId],
    queryFn: () => getStageHistoryApi(consultedServiceId),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
