// src/features/consulted-services/hooks/useConfirmConsultedService.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { confirmConsultedServiceAction } from "@/server/actions/consulted-service.actions";
import { CONSULTED_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useConfirmConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => confirmConsultedServiceAction(id),
    onSuccess: (_, id) => {
      notify.success(CONSULTED_SERVICE_MESSAGES.CONFIRM_SUCCESS);
      // Invalidate detail + list
      qc.invalidateQueries({ queryKey: ["consulted-services", "detail", id] });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
