// src/features/payments/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPaymentVouchersApi,
  getPaymentVouchersDailyApi,
  getPaymentVoucherApi,
  getUnpaidServicesApi,
} from "../api";
import type {
  GetPaymentVouchersQuery,
  GetPaymentVouchersDailyQuery,
} from "@/shared/validation/payment-voucher.schema";

/**
 * Hook: Fetch payment vouchers list with optional filters
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreatePaymentVoucher, useUpdatePaymentVoucher, useDeletePaymentVoucher
 */
export function usePaymentVouchers(params?: GetPaymentVouchersQuery) {
  return useQuery({
    queryKey: ["payment-vouchers", params],
    queryFn: () => getPaymentVouchersApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch daily payment vouchers by date and clinic
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreatePaymentVoucher, useUpdatePaymentVoucher, useDeletePaymentVoucher
 */
export function usePaymentVouchersDaily(params: GetPaymentVouchersDailyQuery) {
  return useQuery({
    queryKey: ["payment-vouchers", "daily", params],
    queryFn: () => getPaymentVouchersDailyApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch single payment voucher by ID
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Enabled: Only when ID is provided
 * Invalidated by: useUpdatePaymentVoucher
 */
export function usePaymentVoucher(id: string | null | undefined) {
  return useQuery({
    queryKey: ["payment-vouchers", "detail", id],
    queryFn: () => getPaymentVoucherApi(id!),
    enabled: !!id,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Fetch unpaid services for a specific customer
 * Used in payment form to show services available for payment
 * Enabled: Only when customer ID is provided
 * Invalidated by: useCreatePaymentVoucher, useUpdatePaymentVoucher, useDeletePaymentVoucher
 */
export function useUnpaidServices(customerId: string | null | undefined) {
  return useQuery({
    queryKey: ["unpaid-services", customerId],
    queryFn: () => getUnpaidServicesApi(customerId!),
    enabled: !!customerId,
  });
}
