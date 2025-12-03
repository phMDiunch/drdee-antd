// src/features/labo-items/hooks/useDeleteLaboItem.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteLaboItemAction } from "@/server/actions/labo-item.actions";
import { LABO_ITEM_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteLaboItemAction(id),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
