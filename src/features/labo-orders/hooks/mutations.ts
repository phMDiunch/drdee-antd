// src/features/labo-orders/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createLaboOrderAction,
  updateLaboOrderAction,
  deleteLaboOrderAction,
  receiveLaboOrderAction,
} from "@/server/actions/labo-order.actions";
import { LABO_ORDER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateLaboOrderRequest,
  UpdateLaboOrderRequest,
} from "@/shared/validation/labo-order.schema";

/**
 * Mutation hook: Create new labo order
 * Uses Server Action directly (không qua API route)
 * Invalidates: labo-orders list
 */
export function useCreateLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateLaboOrderRequest) => createLaboOrderAction(data),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-orders"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Mutation hook: Update labo order
 * Uses Server Action directly (không qua API route)
 * Invalidates: labo-orders list
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

/**
 * Mutation hook: Delete labo order
 * Uses Server Action directly (không qua API route)
 * Invalidates: labo-orders list
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

/**
 * Mutation hook: Receive labo order (quick action)
 * Uses Server Action directly (không qua API route)
 * Invalidates: labo-orders list
 */
export function useReceiveLaboOrder() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (orderId: string) => receiveLaboOrderAction(orderId),
    onSuccess: () => {
      notify.success(LABO_ORDER_MESSAGES.RECEIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-orders"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
