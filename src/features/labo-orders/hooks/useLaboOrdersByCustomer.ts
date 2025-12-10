// src/features/labo-orders/hooks/useLaboOrdersByCustomer.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getDailyLaboOrdersApi } from "../api";

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
