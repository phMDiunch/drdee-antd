// src/features/treatment-logs/hooks/useDeleteTreatmentLog.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteTreatmentLogAction } from "@/server/actions/treatment-log.actions";
import { TREATMENT_LOG_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteTreatmentLog(customerId?: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteTreatmentLogAction(id),
    onSuccess: () => {
      notify.success(TREATMENT_LOG_MESSAGES.DELETE_SUCCESS);
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
