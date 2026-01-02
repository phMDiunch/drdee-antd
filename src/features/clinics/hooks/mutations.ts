// src/features/clinics/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createClinicAction,
  updateClinicAction,
  deleteClinicAction,
  archiveClinicAction,
  unarchiveClinicAction,
} from "@/server/actions/clinic.actions";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateClinicRequest,
  UpdateClinicRequest,
} from "@/shared/validation/clinic.schema";

/**
 * Create new clinic
 * Invalidates: clinics list
 */
export function useCreateClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateClinicRequest) => createClinicAction(data),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing clinic
 * Invalidates: clinic detail + clinics list
 */
export function useUpdateClinic(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateClinicRequest) =>
      updateClinicAction(id, payload),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: CLINIC_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete clinic (hard delete)
 * Invalidates: clinics list
 */
export function useDeleteClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteClinicAction(id),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive clinic (soft delete)
 * Invalidates: clinics list
 */
export function useArchiveClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => archiveClinicAction(id),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive clinic (restore)
 * Invalidates: clinics list
 */
export function useUnarchiveClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => unarchiveClinicAction(id),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["clinics"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
