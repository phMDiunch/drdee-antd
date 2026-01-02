// src/features/dental-services/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDentalServicesApi, getDentalServiceByIdApi } from "../api";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

/**
 * Fetch list of dental services (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useDentalServices(includeArchived: boolean) {
  return useQuery({
    queryKey: DENTAL_SERVICE_QUERY_KEYS.list(includeArchived),
    queryFn: () => getDentalServicesApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single dental service by ID (Master Data)
 * Cache: Infinity
 */
export function useDentalServiceById(id?: string) {
  return useQuery({
    queryKey: id
      ? DENTAL_SERVICE_QUERY_KEYS.byId(id)
      : ["dental-service", "empty"],
    queryFn: () => getDentalServiceByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
