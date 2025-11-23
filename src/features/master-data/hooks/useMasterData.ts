// src/features/master-data/hooks/useMasterDataList.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataList } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "../constants";

export function useMasterData() {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.list(),
    queryFn: () => getMasterDataList(),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
