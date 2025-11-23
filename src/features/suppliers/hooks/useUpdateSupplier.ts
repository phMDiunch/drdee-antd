// src/features/suppliers/hooks/useUpdateSupplier.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateSupplierAction } from "@/server/actions/supplier.actions";
import { SUPPLIER_MESSAGES, SUPPLIER_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateSupplierRequest } from "@/shared/validation/supplier.schema";

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateSupplierRequest) =>
      updateSupplierAction(id, payload),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
