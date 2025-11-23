// src/features/materials/hooks/useUpdateMaterial.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateMaterialAction } from "@/server/actions/material.actions";
import { MATERIAL_MESSAGES, MATERIAL_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateMaterialRequest } from "@/shared/validation/material.schema";

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
