// src/features/payments/hooks/usePaymentVouchers.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentVouchersApi } from "../api";
import type { GetPaymentVouchersQuery } from "@/shared/validation/payment-voucher.schema";

export function usePaymentVouchers(params?: GetPaymentVouchersQuery) {
  return useQuery({
    queryKey: ["payment-vouchers", params],
    queryFn: () => getPaymentVouchersApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
