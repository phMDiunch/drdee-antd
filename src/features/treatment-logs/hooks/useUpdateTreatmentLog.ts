// src/features/treatment-logs/hooks/useUpdateTreatmentLog.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateTreatmentLogAction } from "@/server/actions/treatment-log.actions";
import { TREATMENT_LOG_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateTreatmentLogRequest } from "@/shared/validation/treatment-log.schema";

export function useUpdateTreatmentLog(customerId?: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTreatmentLogRequest;
    }) => updateTreatmentLogAction(id, data),
    onSuccess: () => {
      notify.success(TREATMENT_LOG_MESSAGES.UPDATE_SUCCESS);
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
      // Invalidate daily view queries
      qc.invalidateQueries({
        queryKey: ["treatment-logs", "daily"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
