// src/features/suppliers/hooks/useArchiveSupplier.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { archiveSupplierAction } from "@/server/actions/supplier.actions";
import { SUPPLIER_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useArchiveSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveSupplierAction(id),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
