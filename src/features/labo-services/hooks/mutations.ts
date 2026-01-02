// src/features/labo-services/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createLaboServiceAction,
  updateLaboServiceAction,
  deleteLaboServiceAction,
  archiveLaboServiceAction,
  unarchiveLaboServiceAction,
} from "@/server/actions/labo-service.actions";
import { LABO_SERVICE_MESSAGES, LABO_SERVICE_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateLaboServiceRequest,
  UpdateLaboServiceRequest,
} from "@/shared/validation/labo-service.schema";

/**
 * Create new labo service
 * Invalidates: labo-services list
 */
export function useCreateLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateLaboServiceRequest) =>
      createLaboServiceAction(data),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing labo service
 * Invalidates: labo service detail + labo-services list
 */
export function useUpdateLaboService(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateLaboServiceRequest) =>
      updateLaboServiceAction(id, payload),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: LABO_SERVICE_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete labo service permanently
 * Invalidates: labo-services list
 */
export function useDeleteLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteLaboServiceAction(id),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive labo service (soft delete)
 * Invalidates: labo-services list
 */
export function useArchiveLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => archiveLaboServiceAction(id),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive labo service (restore from soft delete)
 * Invalidates: labo-services list
 */
export function useUnarchiveLaboService() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => unarchiveLaboServiceAction(id),
    onSuccess: () => {
      notify.success(LABO_SERVICE_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
