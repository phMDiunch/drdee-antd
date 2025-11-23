// src/features/materials/hooks/useMaterialById.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getMaterialByIdApi } from "../api";
import { MATERIAL_QUERY_KEYS } from "../constants";

export function useMaterialById(id: string | null) {
  return useQuery({
    queryKey: MATERIAL_QUERY_KEYS.byId(id ?? ""),
    queryFn: () => getMaterialByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
