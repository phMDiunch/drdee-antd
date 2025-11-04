// src/features/dental-services/hooks/useDentalServices.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getDentalServicesApi } from "../api/getDentalServices";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

export function useDentalServices(includeArchived: boolean) {
  return useQuery({
    queryKey: DENTAL_SERVICE_QUERY_KEYS.list(includeArchived),
    queryFn: () => getDentalServicesApi(includeArchived),
    staleTime: 8 * 60 * 60 * 1000, // 8 giờ - Dịch vụ ít thay đổi trong ca làm
    gcTime: 24 * 60 * 60 * 1000, // 24 giờ - Giữ trong memory cả ngày
  });
}
