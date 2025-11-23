// src/features/master-data/hooks/useMasterDataById.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getMasterDataById } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";

export function useMasterDataById(id: string | undefined) {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.byId(id ?? ""),
    queryFn: () => getMasterDataById(id!),
    enabled: !!id,
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
    refetchOnWindowFocus: false, // Chuyển tab không fetch lại
    refetchOnMount: false, // Component mount lại không fetch lại
    refetchOnReconnect: false, // Mất mạng có lại không fetch lại
  });
}
