// src/features/labo-orders/hooks/useReceiveLaboOrder.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { receiveLaboOrderAction } from "@/server/actions/labo-order.actions";
import { LABO_ORDER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useReceiveLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (orderId: string) => receiveLaboOrderAction(orderId),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.RECEIVE_SUCCESS);
      // Invalidate both daily queries (sent + returned) and statistics
      qc.invalidateQueries({ queryKey: ["labo-orders-daily"] });
      qc.invalidateQueries({ queryKey: ["labo-orders-statistics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
