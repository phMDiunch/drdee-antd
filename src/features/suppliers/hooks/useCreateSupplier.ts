// src/features/suppliers/hooks/useCreateSupplier.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createSupplierAction } from "@/server/actions/supplier.actions";
import { SUPPLIER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateSupplierRequest } from "@/shared/validation/supplier.schema";

export function useCreateSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => createSupplierAction(data),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
