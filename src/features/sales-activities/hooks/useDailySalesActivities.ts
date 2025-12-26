// src/features/sales-activities/hooks/useDailySalesActivities.ts
import { useQuery } from "@tanstack/react-query";
import { getDailySalesActivitiesApi } from "../api";

/**
 * React Query hook for fetching daily sales activities with statistics
 *
 * @param date - Date in YYYY-MM-DD format
 * @param clinicId - Clinic UUID
 * @returns Query result with daily sales activities and statistics
 *
 * Query Key: ["sales-activities", "daily", date, clinicId]
 * Caching: staleTime 1min, gcTime 5min (transactional data)
 */
export function useDailySalesActivities(date: string, clinicId: string) {
  return useQuery({
    queryKey: ["sales-activities", "daily", date, clinicId],
    queryFn: () => getDailySalesActivitiesApi({ date, clinicId }),
    staleTime: 60 * 1000, // 1 minute (transactional data)
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Fetch lại khi chuyển tab
    enabled: !!date && !!clinicId, // Only fetch when both params are available
  });
}
