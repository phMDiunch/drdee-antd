// src/features/dental-services/hooks/useDentalServiceById.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getDentalServiceByIdApi } from "../api";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

export function useDentalServiceById(id?: string) {
  return useQuery({
    queryKey: id
      ? DENTAL_SERVICE_QUERY_KEYS.byId(id)
      : ["dental-service", "empty"],
    queryFn: () => getDentalServiceByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
