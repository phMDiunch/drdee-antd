// src/features/sales-activities/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSalesActivityAction,
  updateSalesActivityAction,
  deleteSalesActivityAction,
} from "@/server/actions/sales-activity.actions";
import { useNotify } from "@/shared/hooks/useNotify";
import { SALES_ACTIVITY_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateSalesActivityRequest,
  UpdateSalesActivityRequest,
} from "@/shared/validation/sales-activity.schema";

/**
 * Hook: Create new sales activity
 * Invalidates: sales-activities (all queries)
 */
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

/**
 * Hook: Update existing sales activity
 * Invalidates: sales-activities (all queries)
 */
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

/**
 * Hook: Delete sales activity
 * Invalidates: sales-activities (all queries)
 */
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
