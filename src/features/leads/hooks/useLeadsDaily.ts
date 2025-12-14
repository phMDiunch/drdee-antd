"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeadsDailyApi, type GetLeadsDailyParams } from "../api";
import { LEAD_QUERY_KEYS } from "../constants";

/**
 * Hook: Get leads list for daily view
 * Usage: const { data, isLoading } = useLeadsDaily({ date: "2025-12-14" });
 */
export function useLeadsDaily(params?: GetLeadsDailyParams) {
  return useQuery({
    queryKey: LEAD_QUERY_KEYS.daily(params?.date),
    queryFn: () => getLeadsDailyApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
