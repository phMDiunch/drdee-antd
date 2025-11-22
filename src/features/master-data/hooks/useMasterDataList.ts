// src/features/master-data/hooks/useMasterDataList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataList } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";

export function useMasterDataList(
  rootId?: string | null,
  includeInactive?: boolean
) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.list(rootId, includeInactive),
    queryFn: () => getMasterDataList({ rootId, includeInactive }),
    staleTime: Infinity, // Master data changes infrequently
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnWindowFocus: false, // Do not refetch on window focus
  });
}

/**
 * Hook to fetch root categories only
 */
export function useMasterDataRoots(includeInactive?: boolean) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.roots(includeInactive),
    queryFn: () =>
      import("../api").then((m) => m.getMasterDataRoots(includeInactive)),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
