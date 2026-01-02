// src/features/labo-items/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createLaboItemAction,
  updateLaboItemAction,
  deleteLaboItemAction,
  archiveLaboItemAction,
  unarchiveLaboItemAction,
} from "@/server/actions/labo-item.actions";
import { LABO_ITEM_MESSAGES, LABO_ITEM_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateLaboItemRequest,
  UpdateLaboItemRequest,
} from "@/shared/validation/labo-item.schema";

/**
 * Create new labo item
 * Invalidates: labo-items list
 */
export function useCreateLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateLaboItemRequest) => createLaboItemAction(data),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing labo item
 * Invalidates: labo item detail + labo-items list
 */
export function useUpdateLaboItem(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: UpdateLaboItemRequest) =>
      updateLaboItemAction(id, payload),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: LABO_ITEM_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete labo item permanently
 * Invalidates: labo-items list
 */
export function useDeleteLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => deleteLaboItemAction(id),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive labo item (soft delete)
 * Invalidates: labo-items list
 */
export function useArchiveLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => archiveLaboItemAction(id),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive labo item (restore from soft delete)
 * Invalidates: labo-items list
 */
export function useUnarchiveLaboItem() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (id: string) => unarchiveLaboItemAction(id),
    onSuccess: () => {
      notify.success(LABO_ITEM_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["labo-items"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
