// src/features/labo-orders/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDailyLaboOrdersApi } from "../api";
import type { GetDailyLaboOrdersQuery } from "@/shared/validation/labo-order.schema";

/**
 * Query hook: Get daily labo orders (sent or returned)
 * Transactional data - refetch on focus
 */
export function useLaboOrdersDaily(params: GetDailyLaboOrdersQuery) {
  return useQuery({
    queryKey: [
      "labo-orders",
      "daily",
      params.date,
      params.type,
      params.clinicId,
    ],
    queryFn: () => getDailyLaboOrdersApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch labo orders for a specific customer
 * Used in Customer Detail page - Labo Orders Tab
 * Pattern: Same as useConsultedServicesByCustomer
 */
export function useLaboOrdersByCustomer(customerId: string) {
  return useQuery({
    queryKey: ["labo-orders", "customer", customerId],
    queryFn: () =>
      getDailyLaboOrdersApi({
        customerId, // Filter by customer
        date: undefined,
        type: undefined,
        clinicId: undefined,
      }),
    enabled: !!customerId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
