// src/features/treatment-logs/hooks/useCreateTreatmentLog.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createTreatmentLogAction } from "@/server/actions/treatment-log.actions";
import { TREATMENT_LOG_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateTreatmentLogRequest } from "@/shared/validation/treatment-log.schema";

export function useCreateTreatmentLog(customerId?: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateTreatmentLogRequest) =>
      createTreatmentLogAction(data),
    onSuccess: () => {
      notify.success(TREATMENT_LOG_MESSAGES.CREATE_SUCCESS);
      if (customerId) {
        // Invalidate treatment logs
        qc.invalidateQueries({
          queryKey: ["appointments", "checked-in", customerId],
        });
        // Invalidate consulted services (treatmentStatus auto-updated)
        qc.invalidateQueries({
          queryKey: ["consulted-services"],
        });
      }
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
