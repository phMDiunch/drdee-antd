// src/features/payments/hooks/useUpdatePaymentVoucher.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updatePaymentVoucherAction } from "@/server/actions/payment-voucher.actions";
import { PAYMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdatePaymentVoucherRequest } from "@/shared/validation/payment-voucher.schema";

export function useUpdatePaymentVoucher() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentVoucherRequest;
    }) => updatePaymentVoucherAction(id, data),
    onSuccess: (_, variables) => {
      notify.success(PAYMENT_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["payment-vouchers", "detail", variables.id],
      });
      qc.invalidateQueries({ queryKey: ["payment-vouchers"] });
      qc.invalidateQueries({ queryKey: ["unpaid-services"] });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
