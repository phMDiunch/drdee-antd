// src/features/materials/hooks/useArchiveMaterial.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { archiveMaterialAction } from "@/server/actions/material.actions";
import { MATERIAL_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

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
