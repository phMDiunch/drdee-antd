// src/features/sales-activities/hooks/useUpdateSalesActivity.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSalesActivityAction } from "@/server/actions/sales-activity.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import { SALES_ACTIVITY_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateSalesActivityRequest } from "@/shared/validation/sales-activity.schema";

export function useUpdateSalesActivity() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSalesActivityRequest;
    }) => updateSalesActivityAction(id, data),
    onSuccess: () => {
      notify.success(SALES_ACTIVITY_MESSAGES.UPDATE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ["sales-activities"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
