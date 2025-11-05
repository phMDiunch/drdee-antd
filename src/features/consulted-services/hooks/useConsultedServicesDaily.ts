// src/features/consulted-services/hooks/useConsultedServicesDaily.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultedServicesDailyApi } from "../api";
import type { GetConsultedServicesDailyQuery } from "@/shared/validation/consulted-service.schema";

export function useConsultedServicesDaily(
  params: GetConsultedServicesDailyQuery
) {
  return useQuery({
    queryKey: ["consulted-services", "daily", params.date, params.clinicId],
    queryFn: () => getConsultedServicesDailyApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
