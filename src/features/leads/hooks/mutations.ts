"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createLeadAction,
  updateLeadAction,
  deleteLeadAction,
  convertLeadToCustomerAction,
} from "@/server/actions/lead.actions";
import { LEAD_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateLeadRequest,
  UpdateLeadRequest,
  ConvertLeadRequest,
} from "@/shared/validation/lead.schema";

/**
 * Hook: Create new lead
 * Usage: const { mutate } = useCreateLead();
 */
export function useCreateLead() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateLeadRequest) => createLeadAction(data),
    onSuccess: () => {
      notify.success(LEAD_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Update existing lead
 * Usage: const { mutate } = useUpdateLead();
 */
export function useUpdateLead() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLeadRequest }) =>
      updateLeadAction(id, data),
    onSuccess: (_, variables) => {
      notify.success(LEAD_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["lead", variables.id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Delete lead
 * Usage: const { mutate } = useDeleteLead();
 */
export function useDeleteLead() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteLeadAction(id),
    onSuccess: () => {
      notify.success(LEAD_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Convert lead to customer
 * Usage: const { mutate } = useConvertLead();
 */
export function useConvertLead() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvertLeadRequest }) =>
      convertLeadToCustomerAction(id, data),
    onSuccess: (_, variables) => {
      notify.success("Chuyển đổi Lead thành Khách hàng thành công");
      qc.invalidateQueries({ queryKey: ["lead", variables.id] });
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
