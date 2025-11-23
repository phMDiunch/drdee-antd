// src/features/master-data/hooks/useCreateMasterData.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createMasterDataAction } from "@/server/actions/master-data.actions";
import { MASTER_DATA_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateMasterDataRequest } from "@/shared/validation/master-data.schema";

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
