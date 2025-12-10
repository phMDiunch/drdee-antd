// src/features/labo-orders/hooks/useDeleteLaboOrder.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteLaboOrderAction } from "@/server/actions/labo-order.actions";
import { LABO_ORDER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * Mutation hook: Delete labo order
 * Uses Server Action directly (không qua API route)
 */
export function useDeleteLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (orderId: string) => deleteLaboOrderAction(orderId),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-orders"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
