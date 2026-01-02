// src/features/suppliers/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getSuppliersApi, getSupplierByIdApi } from "../api";
import { SUPPLIER_QUERY_KEYS } from "../constants";

/**
 * Fetch list of suppliers (Master Data)
 * Cache: Infinity (chỉ refresh khi F5 hoặc mutation invalidate)
 */
export function useSuppliers(includeArchived: boolean) {
  return useQuery({
    queryKey: SUPPLIER_QUERY_KEYS.list(includeArchived),
    queryFn: () => getSuppliersApi(includeArchived),
    staleTime: Infinity, // Dữ liệu không bao giờ bị coi là "cũ"
    gcTime: 1000 * 60 * 60 * 24, // Giữ trong bộ nhớ 24h
  });
}

/**
 * Fetch single supplier by ID (Master Data)
 * Cache: Infinity
 */
export function useSupplierById(id?: string) {
  return useQuery({
    queryKey: id ? SUPPLIER_QUERY_KEYS.byId(id) : ["supplier", "empty"],
    queryFn: () => getSupplierByIdApi(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });
}
