// src/features/sales-pipeline/hooks/usePipelineServices.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPipelineServicesApi } from "../api";
import { SALES_PIPELINE_QUERY_KEYS } from "../constants";
import type { GetSalesPipelineQuery } from "@/shared/validation/sales-activity.schema";

/**
 * Query hook for pipeline services (dashboard)
 * Transactional data - refresh frequently
 */
export function usePipelineServices(params: GetSalesPipelineQuery) {
  return useQuery({
    queryKey: SALES_PIPELINE_QUERY_KEYS.list(params),
    queryFn: () => getPipelineServicesApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
