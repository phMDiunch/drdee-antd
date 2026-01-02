// src/features/consulted-services/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getConsultedServicesApi,
  getConsultedServicesDailyApi,
  getConsultedServicesPendingApi,
  getConsultedServiceByIdApi,
} from "../api";
import type {
  GetConsultedServicesQuery,
  GetConsultedServicesDailyQuery,
  GetConsultedServicesPendingQuery,
} from "@/shared/validation/consulted-service.schema";

/**
 * Hook: Fetch consulted services list with optional filters
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateConsultedService, useUpdateConsultedService, useDeleteConsultedService, useConfirmConsultedService, useAssignConsultingSale
 */
export function useConsultedServices(params?: GetConsultedServicesQuery) {
  return useQuery({
    queryKey: ["consulted-services", params],
    queryFn: () => getConsultedServicesApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch daily consulted services by date and clinic
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateConsultedService, useUpdateConsultedService, useDeleteConsultedService, useConfirmConsultedService, useAssignConsultingSale
 */
export function useConsultedServicesDaily(
  params: GetConsultedServicesDailyQuery
) {
  return useQuery({
    queryKey: ["consulted-services", "daily", params.date, params.clinicId],
    queryFn: () => getConsultedServicesDailyApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch pending consulted services by month and clinic
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateConsultedService, useUpdateConsultedService, useDeleteConsultedService, useConfirmConsultedService
 */
export function useConsultedServicesPending(
  params: GetConsultedServicesPendingQuery
) {
  return useQuery({
    queryKey: ["consulted-services", "pending", params.month, params.clinicId],
    queryFn: () => getConsultedServicesPendingApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch single consulted service by ID
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Enabled: Only when ID is provided
 * Invalidated by: useUpdateConsultedService, useConfirmConsultedService
 */
export function useConsultedService(id: string) {
  return useQuery({
    queryKey: ["consulted-services", "detail", id],
    queryFn: () => getConsultedServiceByIdApi(id),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

/**
 * Hook: Fetch consulted services for a specific customer
 * Used in Customer Detail page
 * Cache: Standard 1 minute stale time
 * Enabled: Only when customer ID is provided
 * Invalidated by: useCreateConsultedService, useUpdateConsultedService, useDeleteConsultedService, useConfirmConsultedService, useAssignConsultingSale
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
