// src/features/materials/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMaterialsApi, getMaterialByIdApi } from "../api";
import { MATERIAL_QUERY_KEYS } from "../constants";

/**
 * Fetch list of materials (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useMaterials(includeArchived: boolean) {
  return useQuery({
    queryKey: MATERIAL_QUERY_KEYS.list(includeArchived),
    queryFn: () => getMaterialsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single material by ID (Master Data)
 * Cache: Infinity
 */
export function useMaterialById(id: string | null) {
  return useQuery({
    queryKey: MATERIAL_QUERY_KEYS.byId(id ?? ""),
    queryFn: () => getMaterialByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
