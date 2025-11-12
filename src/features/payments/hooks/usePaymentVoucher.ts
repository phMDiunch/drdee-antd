// src/features/payments/hooks/usePaymentVoucher.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getPaymentVoucherApi } from "../api";

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
