// src/features/payments/hooks/usePaymentVouchersDaily.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentVouchersDailyApi } from "../api";
import type { GetPaymentVouchersDailyQuery } from "@/shared/validation/payment-voucher.schema";

export function usePaymentVouchersDaily(params: GetPaymentVouchersDailyQuery) {
  return useQuery({
    queryKey: ["payment-vouchers", "daily", params],
    queryFn: () => getPaymentVouchersDailyApi(params),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
}
