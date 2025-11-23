// src/features/master-data/hooks/useMasterDataList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataList } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";

export function useMasterData(
  rootId?: string | null,
  includeInactive?: boolean
) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.list(rootId, includeInactive),
    queryFn: () => getMasterDataList({ rootId, includeInactive }),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
    refetchOnWindowFocus: false, // Chuyển tab không fetch lại
    refetchOnMount: false, // Component mount lại không fetch lại
    refetchOnReconnect: false, // Mất mạng có lại không fetch lại
  });
}
