// src/features/suppliers/hooks/useSupplierById.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupplierByIdApi } from "../api";
import { SUPPLIER_QUERY_KEYS } from "../constants";

export function useSupplierById(id?: string) {
  return useQuery({
    queryKey: id ? SUPPLIER_QUERY_KEYS.byId(id) : ["supplier", "empty"],
    queryFn: () => getSupplierByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}
