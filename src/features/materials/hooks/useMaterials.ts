// src/features/materials/hooks/useMaterials.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getMaterialsApi } from "../api";
import { MATERIAL_QUERY_KEYS } from "../constants";

export function useMaterials(includeArchived: boolean) {
  return useQuery({
    queryKey: MATERIAL_QUERY_KEYS.list(includeArchived),
    queryFn: () => getMaterialsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
