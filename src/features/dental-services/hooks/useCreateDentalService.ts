// src/features/dental-services/hooks/useCreateDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createDentalServiceApi } from "../api";
import { DENTAL_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: createDentalServiceApi,
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
