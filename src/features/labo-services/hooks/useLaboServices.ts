// src/features/labo-services/hooks/useLaboServices.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getLaboServicesApi } from "../api";
import { LABO_SERVICE_QUERY_KEYS } from "../constants";

export function useLaboServices(params?: {
  sortBy?: string;
  sortOrder?: string;
  supplierId?: string;
}) {
  return useQuery({
    queryKey: LABO_SERVICE_QUERY_KEYS.list(params),
    queryFn: () => getLaboServicesApi(params),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ" (master data)
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
