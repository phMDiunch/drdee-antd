"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicsApi } from "../api";
import { CLINIC_QUERY_KEYS } from "../constants";

export function useClinics(includeArchived?: boolean) {
  return useQuery({
    queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
    queryFn: () => getClinicsApi(includeArchived),
    staleTime: Infinity, // Cache vĩnh viễn - Clinic hầu như không bao giờ thay đổi
    gcTime: 24 * 60 * 60 * 1000, // 24 giờ - Giữ trong memory cả ngày
  });
}
