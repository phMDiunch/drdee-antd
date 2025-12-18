// src/features/sales-pipeline/hooks/useClaimPipeline.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { claimPipelineAction } from "@/server/actions/sales-pipeline.actions";
import { SALES_PIPELINE_MESSAGES } from "../constants";

/**
 * Mutation hook for claiming a pipeline service
 */
export function useClaimPipeline() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (consultedServiceId: string) =>
      claimPipelineAction(consultedServiceId),
    onSuccess: () => {
      notify.success(SALES_PIPELINE_MESSAGES.CLAIM_SUCCESS);
      // Invalidate all pipeline queries
      qc.invalidateQueries({
        queryKey: ["sales-pipeline"],
      });
      // Invalidate consulted services (for button state update)
      qc.invalidateQueries({
        queryKey: ["consulted-services"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: SALES_PIPELINE_MESSAGES.CLAIM_ERROR }),
  });
}
