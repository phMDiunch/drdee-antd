// src/features/payments/hooks/useDeletePaymentVoucher.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deletePaymentVoucherAction } from "@/server/actions/payment-voucher.actions";
import { PAYMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeletePaymentVoucher() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deletePaymentVoucherAction(id),
    onSuccess: () => {
      notify.success(PAYMENT_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["payment-vouchers"] });
      qc.invalidateQueries({ queryKey: ["unpaid-services"] });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
