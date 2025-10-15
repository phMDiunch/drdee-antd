// src/features/dental-services/hooks/useUnarchiveDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateDentalServiceApi } from "../api";
import {
  DENTAL_SERVICE_MESSAGES,
  DENTAL_SERVICE_QUERY_KEYS,
} from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUpdateDentalService(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: unknown) => updateDentalServiceApi(id, payload),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: DENTAL_SERVICE_QUERY_KEYS.DETAIL(id) });
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: any) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
