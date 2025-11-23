// src/features/dental-services/hooks/useUpdateDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateDentalServiceAction } from "@/server/actions/dental-service.actions";
import {
  DENTAL_SERVICE_MESSAGES,
  DENTAL_SERVICE_QUERY_KEYS,
} from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateDentalServiceRequest } from "@/shared/validation/dental-service.schema";

export function useUpdateDentalService(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateDentalServiceRequest) =>
      updateDentalServiceAction(id, payload),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: DENTAL_SERVICE_QUERY_KEYS.byId(id),
        refetchType: "active",
      });
      qc.invalidateQueries({
        queryKey: ["dental-services"],
        refetchType: "active",
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
