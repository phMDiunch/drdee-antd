// src/features/clinics/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicsApi, getClinicByIdApi } from "../api";
import { CLINIC_QUERY_KEYS } from "../constants";

/**
 * Fetch list of clinics (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useClinics(includeArchived?: boolean) {
  return useQuery({
    queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
    queryFn: () => getClinicsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single clinic by ID (Master Data)
 * Cache: Infinity
 */
export function useClinicById(id?: string) {
  return useQuery({
    queryKey: id ? CLINIC_QUERY_KEYS.byId(id) : ["clinic", "empty"],
    queryFn: () => getClinicByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
