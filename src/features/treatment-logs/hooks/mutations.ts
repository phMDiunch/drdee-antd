// src/features/treatment-logs/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createTreatmentLogAction,
  updateTreatmentLogAction,
  deleteTreatmentLogAction,
} from "@/server/actions/treatment-log.actions";
import { TREATMENT_LOG_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateTreatmentLogRequest,
  UpdateTreatmentLogRequest,
} from "@/shared/validation/treatment-log.schema";

/**
 * Hook: Create new treatment log
 * Invalidates: appointments (checked-in for specific customer), consulted-services (treatmentStatus auto-updated), treatment-logs (daily)
 * Optional: Provide customerId to invalidate customer-specific queries
 */
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
      // Invalidate daily view queries
      qc.invalidateQueries({
        queryKey: ["treatment-logs", "daily"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Update existing treatment log
 * Invalidates: appointments (checked-in for specific customer), consulted-services (treatmentStatus auto-updated), treatment-logs (daily)
 * Optional: Provide customerId to invalidate customer-specific queries
 */
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

/**
 * Hook: Delete treatment log
 * Invalidates: appointments (checked-in for specific customer), consulted-services (treatmentStatus auto-updated), treatment-logs (daily)
 * Optional: Provide customerId to invalidate customer-specific queries
 */
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
      // Invalidate daily view queries
      qc.invalidateQueries({
        queryKey: ["treatment-logs", "daily"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
