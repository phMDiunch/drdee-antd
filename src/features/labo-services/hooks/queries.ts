// src/features/labo-services/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getLaboServicesApi, getLaboServiceByIdApi } from "../api";
import { LABO_SERVICE_QUERY_KEYS } from "../constants";

/**
 * Fetch list of labo services (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 * Supports filtering and sorting
 */
export function useLaboServices(
  includeArchived = false,
  params?: {
    sortBy?: string;
    sortOrder?: string;
    supplierId?: string;
  }
) {
  return useQuery({
    queryKey: LABO_SERVICE_QUERY_KEYS.list({ ...params, includeArchived }),
    queryFn: () => getLaboServicesApi({ ...params, includeArchived }),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ" (master data)
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single labo service by ID (Master Data)
 * Cache: Infinity
 */
export function useLaboServiceById(id: string) {
  return useQuery({
    queryKey: LABO_SERVICE_QUERY_KEYS.byId(id),
    queryFn: () => getLaboServiceByIdApi(id),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
