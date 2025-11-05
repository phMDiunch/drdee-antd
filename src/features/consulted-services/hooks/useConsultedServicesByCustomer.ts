// src/features/consulted-services/hooks/useConsultedServicesByCustomer.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultedServicesApi } from "../api";

/**
 * Hook to fetch consulted services for a specific customer
 * Used in Customer Detail page
 */
export function useConsultedServicesByCustomer(customerId: string) {
  return useQuery({
    queryKey: ["consulted-services", "customer", customerId],
    queryFn: () =>
      getConsultedServicesApi({
        customerId,
        sortField: "consultationDate",
        sortDirection: "desc",
        page: 1,
        pageSize: 100, // Get all services for customer
      }),
    enabled: !!customerId,
  });
}
