// src/features/labo-items/hooks/useCreateLaboItem.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createLaboItemAction } from "@/server/actions/labo-item.actions";
import { LABO_ITEM_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateLaboItemRequest } from "@/shared/validation/labo-item.schema";

export function useCreateLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateLaboItemRequest) => createLaboItemAction(data),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
