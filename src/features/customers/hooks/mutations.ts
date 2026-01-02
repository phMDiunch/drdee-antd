// src/features/customers/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/server/actions/customer.actions";
import { CUSTOMER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/shared/validation/customer.schema";

/**
 * Create new customer
 * Invalidates: customers list
 */
export function useCreateCustomer() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateCustomerRequest) => createCustomerAction(data),
    onSuccess: () => {
      notify.success(CUSTOMER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing customer
 * Invalidates: customer detail + customers list
 */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: UpdateCustomerRequest) => updateCustomerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      notify.success("Cập nhật thông tin khách hàng thành công");
    },
    onError: (error) => {
      notify.error(error, {
        fallback: "Có lỗi xảy ra khi cập nhật khách hàng",
      });
    },
  });
}
