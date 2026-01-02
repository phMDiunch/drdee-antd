// src/features/payments/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createPaymentVoucherAction,
  updatePaymentVoucherAction,
  deletePaymentVoucherAction,
} from "@/server/actions/payment-voucher.actions";
import { PAYMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreatePaymentVoucherRequest,
  UpdatePaymentVoucherRequest,
} from "@/shared/validation/payment-voucher.schema";

/**
 * Hook: Create new payment voucher
 * Invalidates: payment-vouchers, unpaid-services, consulted-services
 * Special: Accepts accountType (COMPANY | PERSONAL) to determine bank account
 */
export function useCreatePaymentVoucher() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      values,
      accountType,
    }: {
      values: CreatePaymentVoucherRequest;
      accountType: "COMPANY" | "PERSONAL";
    }) => createPaymentVoucherAction(values, accountType),
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

/**
 * Hook: Update existing payment voucher
 * Invalidates: payment-vouchers detail (specific ID), payment-vouchers (all lists), unpaid-services, consulted-services
 */
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

/**
 * Hook: Delete payment voucher
 * Invalidates: payment-vouchers (all lists), unpaid-services, consulted-services
 */
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
