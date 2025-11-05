// src/features/consulted-services/hooks/useUpdateConsultedService.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateConsultedServiceAction } from "@/server/actions/consulted-service.actions";
import { CONSULTED_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateConsultedServiceRequest } from "@/shared/validation/consulted-service.schema";

export function useUpdateConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsultedServiceRequest;
    }) => updateConsultedServiceAction(id, data),
    onSuccess: (_, variables) => {
      notify.success(CONSULTED_SERVICE_MESSAGES.UPDATE_SUCCESS);
      // Invalidate detail + list
      qc.invalidateQueries({
        queryKey: ["consulted-services", "detail", variables.id],
      });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
