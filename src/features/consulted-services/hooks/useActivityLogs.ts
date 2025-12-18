// src/features/consulted-services/hooks/useActivityLogs.ts
import { useQuery } from "@tanstack/react-query";
import type { ActivityLogsListResponse } from "@/shared/validation/sales-activity-log.schema";

/**
 * Fetch activity logs for a consulted service
 */
async function getActivityLogsApi(consultedServiceId: string) {
  const res = await fetch(
    `/api/v1/consulted-services/${consultedServiceId}/activity-logs`
  );

  if (!res.ok) {
    const json = await res.json();
    throw new Error(json?.message || "Không thể lấy activity logs");
  }

  const json = await res.json();
  return json as ActivityLogsListResponse;
}

/**
 * Hook to get activity logs for a consulted service
 */
export function useActivityLogs(consultedServiceId: string) {
  return useQuery({
    queryKey: ["activity-logs", consultedServiceId],
    queryFn: () => getActivityLogsApi(consultedServiceId),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
