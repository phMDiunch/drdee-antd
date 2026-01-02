// src/features/customers/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getCustomersDailyApi,
  getCustomerDetailApi,
  searchCustomersApi,
  type GetCustomersDailyParams,
} from "../api";
import { CUSTOMER_QUERY_KEYS } from "../constants";

/**
 * Fetch daily customers list (transactional data)
 * Cache: 30 seconds - shorter due to check-in updates
 */
export function useCustomersDaily(params?: GetCustomersDailyParams) {
  return useQuery({
    queryKey: [
      "customers",
      "daily",
      {
        date: params?.date,
        clinicId: params?.clinicId,
        includeAppointments: params?.includeAppointments,
      },
    ],
    queryFn: () => getCustomersDailyApi(params),
    staleTime: 30_000, // 30 seconds (shorter due to check-in updates)
  });
}

/**
 * Fetch customer detail by ID
 * Returns full customer detail with relations
 * Cache: 5 minutes
 */
export function useCustomerDetail(id: string) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => getCustomerDetailApi(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Base hook for customer search
 * Supports all search contexts: phone lookup, primary contact, customer source, global header search
 * Cache: 30 seconds
 */
export function useCustomerSearch(params: {
  q: string;
  limit?: number;
  requirePhone?: boolean;
  enabled?: boolean;
}) {
  const { enabled = true, limit = 10, requirePhone = false, ...rest } = params;

  const searchParams = {
    q: rest.q,
    limit,
    requirePhone,
  };

  return useQuery({
    queryKey: CUSTOMER_QUERY_KEYS.search(searchParams.q, searchParams),
    queryFn: () => searchCustomersApi(searchParams),
    enabled: enabled && searchParams.q.length >= 1,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for phone duplicate lookup
 * Returns single customer if phone exists, null otherwise
 */
export function useLookupCustomerPhone(phone: string | null) {
  const { data, ...rest } = useCustomerSearch({
    q: phone || "",
    limit: 1,
    enabled: !!phone && phone.length === 10,
  });

  return {
    ...rest,
    data: data?.[0] || null,
  };
}

/**
 * Hook for searching customers in various contexts
 * - Primary contact: requirePhone=true
 * - Customer source: requirePhone=false
 */
export function useCustomersSearch(params: {
  q: string;
  limit?: number;
  requirePhone?: boolean;
}) {
  const { q, limit = 10, requirePhone = false } = params;

  return useCustomerSearch({
    q,
    limit,
    requirePhone,
    enabled: q.length >= 2,
  });
}
