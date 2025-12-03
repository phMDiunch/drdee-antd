// src/features/labo-items/hooks/useLaboItemById.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getLaboItemByIdApi } from "../api";
import { LABO_ITEM_QUERY_KEYS } from "../constants";

export function useLaboItemById(id: string) {
  return useQuery({
    queryKey: LABO_ITEM_QUERY_KEYS.byId(id),
    queryFn: () => getLaboItemByIdApi(id),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
