// src/features/labo-items/hooks/useLaboItems.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getLaboItemsApi } from "../api";
import { LABO_ITEM_QUERY_KEYS } from "../constants";

export function useLaboItems(includeArchived: boolean) {
  return useQuery({
    queryKey: LABO_ITEM_QUERY_KEYS.list(includeArchived),
    queryFn: () => getLaboItemsApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
