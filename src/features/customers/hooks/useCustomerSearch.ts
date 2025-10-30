"use client";

import { useQuery } from "@tanstack/react-query";
import { searchCustomersApi } from "../api/searchCustomers";
import { CUSTOMER_QUERY_KEYS } from "../constants";

/**
 * Base hook for customer search
 * Supports all search contexts: phone lookup, primary contact, customer source, global header search
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
