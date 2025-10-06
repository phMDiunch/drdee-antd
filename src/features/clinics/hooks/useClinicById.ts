"use client";

import { useQuery } from "@tanstack/react-query";
import { getClinicByIdApi } from "../api/getClinicById";
import { CLINIC_QUERY_KEYS } from "../constants";

export function useClinicById(id?: string) {
  return useQuery({
    queryKey: id ? CLINIC_QUERY_KEYS.byId(id) : ["clinic", "empty"],
    queryFn: () => getClinicByIdApi(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}
