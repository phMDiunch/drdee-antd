// src/features/master-data/hooks/useMasterDataCategories.ts
"use client";

import { useMemo } from "react";
import { useMasterData } from "./useMasterData";

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
