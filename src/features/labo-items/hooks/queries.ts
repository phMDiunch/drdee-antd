// src/features/labo-items/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getLaboItemsApi, getLaboItemByIdApi } from "../api";
import { LABO_ITEM_QUERY_KEYS } from "../constants";

/**
 * Fetch list of labo items (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useLaboItems(includeArchived: boolean) {
  return useQuery({
    queryKey: LABO_ITEM_QUERY_KEYS.list(includeArchived),
    queryFn: () => getLaboItemsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single labo item by ID (Master Data)
 * Cache: Infinity
 */
export function useLaboItemById(id: string) {
  return useQuery({
    queryKey: LABO_ITEM_QUERY_KEYS.byId(id),
    queryFn: () => getLaboItemByIdApi(id),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
