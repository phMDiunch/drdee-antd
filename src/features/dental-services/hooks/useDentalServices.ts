// src/features/dental-services/hooks/useDentalServices.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getDentalServicesApi } from "../api";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

export function useDentalServices(includeArchived: boolean) {
  return useQuery({
    queryKey: DENTAL_SERVICE_QUERY_KEYS.list(includeArchived),
    queryFn: () => getDentalServicesApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
