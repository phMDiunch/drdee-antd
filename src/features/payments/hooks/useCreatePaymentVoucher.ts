// src/features/payments/hooks/useCreatePaymentVoucher.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createPaymentVoucherAction } from "@/server/actions/payment-voucher.actions";
import { PAYMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreatePaymentVoucherRequest } from "@/shared/validation/payment-voucher.schema";

export function useCreatePaymentVoucher() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreatePaymentVoucherRequest) =>
      createPaymentVoucherAction(data),
    onSuccess: () => {
      notify.success(PAYMENT_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["payment-vouchers"] });
      qc.invalidateQueries({ queryKey: ["unpaid-services"] });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
