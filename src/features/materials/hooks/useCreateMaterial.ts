// src/features/materials/hooks/useCreateMaterial.ts

"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createMaterialAction } from "@/server/actions/material.actions";
import { MATERIAL_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateMaterialRequest } from "@/shared/validation/material.schema";

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
