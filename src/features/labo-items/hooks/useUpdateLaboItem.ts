// src/features/labo-items/hooks/useUpdateLaboItem.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateLaboItemAction } from "@/server/actions/labo-item.actions";
import { LABO_ITEM_MESSAGES, LABO_ITEM_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateLaboItemRequest } from "@/shared/validation/labo-item.schema";

export function useUpdateLaboItem(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateLaboItemRequest) =>
      updateLaboItemAction(id, payload),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: LABO_ITEM_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
