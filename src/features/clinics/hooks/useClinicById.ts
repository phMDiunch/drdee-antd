"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicByIdApi } from "../api";
import { CLINIC_QUERY_KEYS } from "../constants";

export function useClinicById(id?: string) {
  return useQuery({
    queryKey: id ? CLINIC_QUERY_KEYS.byId(id) : ["clinic", "empty"],
    queryFn: () => getClinicByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
