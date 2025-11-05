// src/features/consulted-services/hooks/useDeleteConsultedService.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteConsultedServiceAction } from "@/server/actions/consulted-service.actions";
import { CONSULTED_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteConsultedServiceAction(id),
    onSuccess: () => {
      notify.success(CONSULTED_SERVICE_MESSAGES.DELETE_SUCCESS);
      // Invalidate list only (detail no longer exists)
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
