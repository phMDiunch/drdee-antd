"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicsApi } from "../api";
import { CLINIC_QUERY_KEYS } from "../constants";

export function useClinics(includeArchived?: boolean) {
  return useQuery({
    queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
    queryFn: () => getClinicsApi(includeArchived),
    staleTime: 60_000,
  });
}
