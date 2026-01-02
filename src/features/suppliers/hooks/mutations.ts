// src/features/suppliers/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createSupplierAction,
  updateSupplierAction,
  deleteSupplierAction,
  archiveSupplierAction,
  unarchiveSupplierAction,
} from "@/server/actions/supplier.actions";
import { SUPPLIER_MESSAGES, SUPPLIER_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateSupplierRequest,
  UpdateSupplierRequest,
} from "@/shared/validation/supplier.schema";

/**
 * Create new supplier
 * Invalidates: suppliers list
 */
export function useCreateSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateSupplierRequest) => createSupplierAction(data),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing supplier
 * Invalidates: supplier detail + list
 */
export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (payload: UpdateSupplierRequest) =>
      updateSupplierAction(id, payload),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: SUPPLIER_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete supplier (hard delete)
 * Invalidates: suppliers list
 */
export function useDeleteSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteSupplierAction(id),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive supplier (soft delete)
 * Invalidates: suppliers list
 */
export function useArchiveSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveSupplierAction(id),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive supplier (restore)
 * Invalidates: suppliers list
 */
export function useUnarchiveSupplier() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => unarchiveSupplierAction(id),
    onSuccess: () => {
      notify.success(SUPPLIER_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
