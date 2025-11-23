// src/features/clinics/hooks/useClinics.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicsApi } from "../api";
import { CLINIC_QUERY_KEYS } from "../constants";

export function useClinics(includeArchived?: boolean) {
  return useQuery({
    queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
    queryFn: () => getClinicsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
    refetchOnWindowFocus: false, // Chuyển tab không fetch lại
    refetchOnMount: false, // Component mount lại không fetch lại
    refetchOnReconnect: false, // Mất mạng có lại không fetch lại
  });
}
