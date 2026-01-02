// src/features/materials/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createMaterialAction,
  updateMaterialAction,
  deleteMaterialAction,
  archiveMaterialAction,
  unarchiveMaterialAction,
} from "@/server/actions/material.actions";
import { MATERIAL_MESSAGES, MATERIAL_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateMaterialRequest,
  UpdateMaterialRequest,
} from "@/shared/validation/material.schema";

/**
 * Create new material
 * Invalidates: materials list
 */
export function useCreateMaterial() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: CreateMaterialRequest) => createMaterialAction(data),
    onSuccess: () => {
      notify.success(MATERIAL_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing material
 * Invalidates: material detail + list
 */
export function useUpdateMaterial(materialId: string) {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (data: UpdateMaterialRequest) =>
      updateMaterialAction(materialId, data),
    onSuccess: () => {
      notify.success(MATERIAL_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: MATERIAL_QUERY_KEYS.byId(materialId) });
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete material (hard delete)
 * Invalidates: materials list
 */
export function useDeleteMaterial() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterialAction(materialId),
    onSuccess: () => {
      notify.success(MATERIAL_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Archive material (soft delete)
 * Invalidates: materials list
 */
export function useArchiveMaterial() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (materialId: string) => archiveMaterialAction(materialId),
    onSuccess: () => {
      notify.success(MATERIAL_MESSAGES.ARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Unarchive material (restore)
 * Invalidates: materials list
 */
export function useUnarchiveMaterial() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: (materialId: string) => unarchiveMaterialAction(materialId),
    onSuccess: () => {
      notify.success(MATERIAL_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
