// src/features/dental-services/hooks/useDentalServiceById.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getDentalServiceByIdApi } from "../api/getDentalServiceById";
import { DENTAL_SERVICE_QUERY_KEYS } from "../constants";

export function useDentalServiceById(id?: string) {
  return useQuery({
    queryKey: id
      ? DENTAL_SERVICE_QUERY_KEYS.byId(id)
      : ["dental-service", "empty"],
    queryFn: () => getDentalServiceByIdApi(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}
