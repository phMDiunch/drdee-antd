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
    refetchOnWindowFocus: false, // Chuyển tab không fetch lại
    refetchOnMount: false, // Component mount lại không fetch lại
    refetchOnReconnect: false, // Mất mạng có lại không fetch lại
  });
}
