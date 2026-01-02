// src/features/master-data/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createMasterDataAction,
  updateMasterDataAction,
  deleteMasterDataAction,
} from "@/server/actions/master-data.actions";
import { MASTER_DATA_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateMasterDataRequest,
  UpdateMasterDataRequest,
} from "@/shared/validation/master-data.schema";

/**
 * Create new master data item
 * Invalidates: master-data list
 */
export function useCreateMasterData() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateMasterDataRequest) => createMasterDataAction(data),
    onSuccess: () => {
      notify.success(MASTER_DATA_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["master-data"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Update existing master data item
 * Invalidates: master-data list
 */
export function useUpdateMasterData() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: UpdateMasterDataRequest) => updateMasterDataAction(data),
    onSuccess: () => {
      notify.success(MASTER_DATA_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["master-data"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Delete master data item permanently
 * Invalidates: master-data list
 */
export function useDeleteMasterData() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteMasterDataAction(id),
    onSuccess: () => {
      notify.success(MASTER_DATA_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["master-data"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
