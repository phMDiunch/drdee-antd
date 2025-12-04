// src/features/labo-orders/hooks/useCreateLaboOrder.ts
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createLaboOrderAction } from "@/server/actions/labo-order.actions";
import { LABO_ORDER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateLaboOrderRequest } from "@/shared/validation/labo-order.schema";

export function useCreateLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateLaboOrderRequest) => createLaboOrderAction(data),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.CREATE_SUCCESS);
      // Invalidate all labo-orders queries (daily + statistics)
      qc.invalidateQueries({ queryKey: ["labo-orders-daily"] });
      qc.invalidateQueries({ queryKey: ["labo-orders-statistics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
