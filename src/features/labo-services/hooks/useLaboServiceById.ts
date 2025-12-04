// src/features/labo-services/hooks/useLaboServiceById.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getLaboServiceByIdApi } from "../api";
import { LABO_SERVICE_QUERY_KEYS } from "../constants";

export function useLaboServiceById(id: string) {
  return useQuery({
    queryKey: LABO_SERVICE_QUERY_KEYS.byId(id),
    queryFn: () => getLaboServiceByIdApi(id),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
