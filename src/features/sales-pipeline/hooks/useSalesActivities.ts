// src/features/sales-pipeline/hooks/useSalesActivities.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSalesActivitiesApi } from "../api";
import { SALES_PIPELINE_QUERY_KEYS } from "../constants";

/**
 * Query hook for sales activities of a consulted service
 * Transactional data - refresh frequently
 */
export function useSalesActivities(consultedServiceId: string) {
  return useQuery({
    queryKey: SALES_PIPELINE_QUERY_KEYS.activities(consultedServiceId),
    queryFn: () => getSalesActivitiesApi(consultedServiceId),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!consultedServiceId,
  });
}
