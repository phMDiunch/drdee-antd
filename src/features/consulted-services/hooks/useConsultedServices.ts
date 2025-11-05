// src/features/consulted-services/hooks/useConsultedServices.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultedServicesApi } from "../api";
import type { GetConsultedServicesQuery } from "@/shared/validation/consulted-service.schema";

export function useConsultedServices(params?: GetConsultedServicesQuery) {
  return useQuery({
    queryKey: ["consulted-services", params],
    queryFn: () => getConsultedServicesApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
