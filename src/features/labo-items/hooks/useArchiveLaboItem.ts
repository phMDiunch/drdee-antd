// src/features/labo-items/hooks/useArchiveLaboItem.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { archiveLaboItemAction } from "@/server/actions/labo-item.actions";
import { LABO_ITEM_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useArchiveLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveLaboItemAction(id),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
