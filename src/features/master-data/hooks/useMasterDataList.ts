// src/features/master-data/hooks/useMasterDataList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataList } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "../constants";

export function useMasterDataList(type?: string, includeInactive?: boolean) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.list(type, includeInactive),
    queryFn: () => getMasterDataList({ type, includeInactive }),
    staleTime: Infinity, // Master data changes infrequently
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
  });
}
