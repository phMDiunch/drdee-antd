// src/features/sales-activities/hooks/useDeleteSalesActivity.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSalesActivityAction } from "@/server/actions/sales-activity.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import { SALES_ACTIVITY_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteSalesActivity() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: deleteSalesActivityAction,
    onSuccess: () => {
      notify.success(SALES_ACTIVITY_MESSAGES.DELETE_SUCCESS);
      queryClient.invalidateQueries({ queryKey: ["sales-activities"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
