// src/features/consulted-services/hooks/useConsultedService.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultedServiceByIdApi } from "../api";

export function useConsultedService(id: string) {
  return useQuery({
    queryKey: ["consulted-services", "detail", id],
    queryFn: () => getConsultedServiceByIdApi(id),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}
