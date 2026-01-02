// src/features/consulted-services/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createConsultedServiceAction,
  updateConsultedServiceAction,
  deleteConsultedServiceAction,
  confirmConsultedServiceAction,
  assignConsultingSaleAction,
} from "@/server/actions/consulted-service.actions";
import { CONSULTED_SERVICE_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateConsultedServiceRequest,
  UpdateConsultedServiceRequest,
} from "@/shared/validation/consulted-service.schema";

/**
 * Hook: Create new consulted service
 * Invalidates: consulted-services (all queries)
 */
export function useCreateConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateConsultedServiceRequest) =>
      createConsultedServiceAction(data),
    onSuccess: () => {
      notify.success(CONSULTED_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Update existing consulted service
 * Invalidates: consulted-services detail (specific ID), consulted-services (all lists)
 */
export function useUpdateConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateConsultedServiceRequest;
    }) => updateConsultedServiceAction(id, data),
    onSuccess: (_, variables) => {
      notify.success(CONSULTED_SERVICE_MESSAGES.UPDATE_SUCCESS);
      // Invalidate detail + list
      qc.invalidateQueries({
        queryKey: ["consulted-services", "detail", variables.id],
      });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Delete consulted service
 * Invalidates: consulted-services (all lists)
 */
export function useDeleteConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteConsultedServiceAction(id),
    onSuccess: () => {
      notify.success(CONSULTED_SERVICE_MESSAGES.DELETE_SUCCESS);
      // Invalidate list only (detail no longer exists)
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Confirm consulted service (transition to confirmed status)
 * Invalidates: consulted-services detail (specific ID), consulted-services (all lists)
 */
export function useConfirmConsultedService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => confirmConsultedServiceAction(id),
    onSuccess: (_, id) => {
      notify.success(CONSULTED_SERVICE_MESSAGES.CONFIRM_SUCCESS);
      // Invalidate detail + list
      qc.invalidateQueries({ queryKey: ["consulted-services", "detail", id] });
      qc.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Assign consulting sale to consulted service
 * Automatically assigns current user as the consulting sales person
 * Invalidates: consulted-services (all lists)
 */
export function useAssignConsultingSale() {
  const queryClient = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: async (consultedServiceId: string) => {
      const result = await assignConsultingSaleAction(consultedServiceId);
      return result;
    },
    onSuccess: () => {
      notify.success("Đã gán sale tư vấn thành công");
      // Invalidate related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["consulted-services"] });
    },
    onError: (error: Error) => {
      notify.error(error.message || "Không thể gán sale tư vấn");
    },
  });
}
