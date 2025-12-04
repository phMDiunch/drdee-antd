// src/features/labo-services/hooks/useDeleteLaboService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteLaboServiceAction } from "@/server/actions/labo-service.actions";
import { LABO_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteLaboServiceAction(id),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
