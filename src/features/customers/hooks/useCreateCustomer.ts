// src/features/customers/hooks/useCreateCustomer.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createCustomerAction } from "@/server/actions/customer.actions";
import { CUSTOMER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateCustomerRequest } from "@/shared/validation/customer.schema";

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
