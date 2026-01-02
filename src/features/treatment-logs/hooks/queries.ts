// src/features/treatment-logs/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDailyTreatmentLogsApi, getCheckedInAppointmentsApi } from "../api";
import { TREATMENT_LOG_QUERY_KEYS } from "../constants";

/**
 * Hook: Fetch daily treatment logs by date and clinic
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateTreatmentLog, useUpdateTreatmentLog, useDeleteTreatmentLog
 */
export function useDailyTreatmentLogs(params: {
  date: string; // YYYY-MM-DD format
  clinicId: string;
}) {
  return useQuery({
    queryKey: ["treatment-logs", "daily", params.date, params.clinicId],
    queryFn: () => getDailyTreatmentLogsApi(params),
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch checked-in appointments with consulted services and treatment logs
 * Used in Customer Detail Treatment Log Tab
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Enabled: Only when customer ID is provided
 * Invalidated by: useCreateTreatmentLog, useUpdateTreatmentLog, useDeleteTreatmentLog
 */
export function useCheckedInAppointments(customerId: string) {
  return useQuery({
    queryKey: TREATMENT_LOG_QUERY_KEYS.checkedInAppointments(customerId),
    queryFn: () => getCheckedInAppointmentsApi(customerId),
    staleTime: 60 * 1000, // 1 min
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: !!customerId,
  });
}
