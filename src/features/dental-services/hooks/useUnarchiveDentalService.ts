// src/features/dental-services/hooks/useUnarchiveDentalService.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { unarchiveDentalServiceAction } from "@/server/actions/dental-service.actions";
import { DENTAL_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUnarchiveDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => unarchiveDentalServiceAction(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
