// src/features/consulted-services/hooks/useCreateConsultedService.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createConsultedServiceAction } from "@/server/actions/consulted-service.actions";
import { CONSULTED_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateConsultedServiceRequest } from "@/shared/validation/consulted-service.schema";

export function useCreateConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateConsultedServiceRequest) =>
      createConsultedServiceAction(data),
    onSuccess: () => {
      notify.success(CONSULTED_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
