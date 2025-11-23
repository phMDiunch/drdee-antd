// src/features/suppliers/hooks/useSuppliers.ts

"use client";
import { useQuery } from "@tanstack/react-query";
import { getSuppliersApi } from "../api";
import { SUPPLIER_QUERY_KEYS } from "../constants";

export function useSuppliers(includeArchived: boolean) {
  return useQuery({
    queryKey: SUPPLIER_QUERY_KEYS.list(includeArchived),
    queryFn: () => getSuppliersApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
