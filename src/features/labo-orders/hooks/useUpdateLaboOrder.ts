// src/features/labo-orders/hooks/useUpdateLaboOrder.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateLaboOrderAction } from "@/server/actions/labo-order.actions";
import { LABO_ORDER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateLaboOrderRequest } from "@/shared/validation/labo-order.schema";

/**
 * Mutation hook: Update labo order
 * Uses Server Action directly (không qua API route)
 */
export function useUpdateLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      orderId,
      data,
    }: {
      orderId: string;
      data: Omit<UpdateLaboOrderRequest, "id">;
    }) => updateLaboOrderAction(orderId, data),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-orders"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
