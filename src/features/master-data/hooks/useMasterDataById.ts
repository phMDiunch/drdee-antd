// src/features/master-data/hooks/useMasterDataById.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataById } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "../constants";

export function useMasterDataById(id: string | undefined) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.detail(id ?? ""),
    queryFn: () => getMasterDataById(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
