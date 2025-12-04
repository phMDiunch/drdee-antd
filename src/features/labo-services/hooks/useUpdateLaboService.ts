// src/features/labo-services/hooks/useUpdateLaboService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateLaboServiceAction } from "@/server/actions/labo-service.actions";
import {
  LABO_SERVICE_MESSAGES,
  LABO_SERVICE_QUERY_KEYS,
} from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateLaboServiceRequest } from "@/shared/validation/labo-service.schema";

export function useUpdateLaboService(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateLaboServiceRequest) =>
      updateLaboServiceAction(id, payload),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: LABO_SERVICE_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
