// src/features/labo-services/hooks/useCreateLaboService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createLaboServiceAction } from "@/server/actions/labo-service.actions";
import { LABO_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateLaboServiceRequest } from "@/shared/validation/labo-service.schema";

export function useCreateLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateLaboServiceRequest) =>
      createLaboServiceAction(data),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
