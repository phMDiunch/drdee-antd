// src/features/sales-pipeline/hooks/useCreateSalesActivity.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createSalesActivityAction } from "@/server/actions/sales-pipeline.actions";
import {
  SALES_PIPELINE_MESSAGES,
  SALES_PIPELINE_QUERY_KEYS,
} from "../constants";
import type { CreateSalesActivityRequest } from "@/shared/validation/sales-activity.schema";

/**
 * Mutation hook for creating a sales activity log
 */
export function useCreateSalesActivity(consultedServiceId: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (
      data: Omit<CreateSalesActivityRequest, "consultedServiceId">
    ) => createSalesActivityAction(consultedServiceId, data),
    onSuccess: () => {
      notify.success(SALES_PIPELINE_MESSAGES.ACTIVITY_CREATE_SUCCESS);
      // Invalidate activities for this service
      qc.invalidateQueries({
        queryKey: SALES_PIPELINE_QUERY_KEYS.activities(consultedServiceId),
      });
      // Invalidate pipeline list (to update "last contact" column)
      qc.invalidateQueries({
        queryKey: ["sales-pipeline"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, {
        fallback: SALES_PIPELINE_MESSAGES.ACTIVITY_CREATE_ERROR,
      }),
  });
}
