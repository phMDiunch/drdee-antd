// src/features/sales-activities/hooks/useCreateSalesActivity.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSalesActivityAction } from "@/server/actions/sales-activity.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import { SALES_ACTIVITY_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateSalesActivityRequest } from "@/shared/validation/sales-activity.schema";

export function useCreateSalesActivity() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateSalesActivityRequest) =>
      createSalesActivityAction(data),
    onSuccess: () => {
      notify.success(SALES_ACTIVITY_MESSAGES.CREATE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ["sales-activities"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
