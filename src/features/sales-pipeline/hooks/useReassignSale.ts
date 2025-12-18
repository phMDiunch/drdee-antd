// src/features/sales-pipeline/hooks/useReassignSale.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { reassignSaleAction } from "@/server/actions/sales-pipeline.actions";
import { SALES_PIPELINE_MESSAGES } from "../constants";
import type { ReassignSaleRequest } from "@/shared/validation/sales-activity.schema";

/**
 * Mutation hook for reassigning a pipeline service (admin only)
 */
export function useReassignSale() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: ReassignSaleRequest) => reassignSaleAction(data),
    onSuccess: () => {
      notify.success(SALES_PIPELINE_MESSAGES.REASSIGN_SUCCESS);
      // Invalidate all pipeline queries
      qc.invalidateQueries({
        queryKey: ["sales-pipeline"],
      });
      // Invalidate consulted services
      qc.invalidateQueries({
        queryKey: ["consulted-services"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: SALES_PIPELINE_MESSAGES.REASSIGN_ERROR }),
  });
}
