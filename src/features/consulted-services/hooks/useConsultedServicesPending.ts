// src/features/consulted-services/hooks/useConsultedServicesPending.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultedServicesPendingApi } from "../api";
import type { GetConsultedServicesPendingQuery } from "@/shared/validation/consulted-service.schema";

export function useConsultedServicesPending(
  params: GetConsultedServicesPendingQuery
) {
  return useQuery({
    queryKey: ["consulted-services", "pending", params.month, params.clinicId],
    queryFn: () => getConsultedServicesPendingApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
