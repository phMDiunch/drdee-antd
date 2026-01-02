// src/features/master-data/hooks/queries.ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMasterDataList } from "../api";
import { MASTER_DATA_QUERY_KEYS } from "../constants";

/**
 * Fetch list of master data (Danh mục dùng chung)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useMasterData() {
  return useQuery({
    queryKey: MASTER_DATA_QUERY_KEYS.list(),
    queryFn: () => getMasterDataList(),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Derive distinct categories from master data list (client-side)
 * No separate API call needed
 */
export function useMasterDataCategories() {
  const { data: allItems = [], isLoading } = useMasterData();

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    allItems.forEach((item) => uniqueCategories.add(item.category));
    return Array.from(uniqueCategories).sort();
  }, [allItems]);

  return {
    data: categories,
    isLoading,
  };
}
