// src/features/treatment-logs/hooks/useCheckedInAppointments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getCheckedInAppointmentsApi } from "../api";
import { TREATMENT_LOG_QUERY_KEYS } from "../constants";

/**
 * Hook to get checked-in appointments with consulted services and treatment logs
 * Used in Customer Detail Treatment Log Tab
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
