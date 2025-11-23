// src/features/suppliers/hooks/useDeleteSupplier.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteSupplierAction } from "@/server/actions/supplier.actions";
import { SUPPLIER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteSupplierAction(id),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
