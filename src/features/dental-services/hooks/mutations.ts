// src/features/dental-services/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createDentalServiceAction,
  updateDentalServiceAction,
  deleteDentalServiceAction,
  archiveDentalServiceAction,
  unarchiveDentalServiceAction,
} from "@/server/actions/dental-service.actions";
import {
  DENTAL_SERVICE_MESSAGES,
  DENTAL_SERVICE_QUERY_KEYS,
} from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateDentalServiceRequest,
  UpdateDentalServiceRequest,
} from "@/shared/validation/dental-service.schema";

/**
 * Create new dental service
 * Invalidates: dental-services list
 */
export function useCreateDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateDentalServiceRequest) =>
      createDentalServiceAction(data),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing dental service
 * Invalidates: dental service detail + list
 */
export function useUpdateDentalService(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (payload: UpdateDentalServiceRequest) =>
      updateDentalServiceAction(id, payload),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: DENTAL_SERVICE_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete dental service (hard delete)
 * Invalidates: dental-services list
 */
export function useDeleteDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteDentalServiceAction(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive dental service (soft delete)
 * Invalidates: dental-services list
 */
export function useArchiveDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveDentalServiceAction(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive dental service (restore)
 * Invalidates: dental-services list
 */
export function useUnarchiveDentalService() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => unarchiveDentalServiceAction(id),
    onSuccess: () => {
      notify.success(DENTAL_SERVICE_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["dental-services"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
