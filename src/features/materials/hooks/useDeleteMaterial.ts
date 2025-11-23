// src/features/materials/hooks/useDeleteMaterial.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteMaterialAction } from "@/server/actions/material.actions";
import { MATERIAL_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

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
