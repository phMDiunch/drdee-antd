// src/features/master-data/hooks/useUpdateMasterData.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateMasterDataAction } from "@/server/actions/master-data.actions";
import { MASTER_DATA_MESSAGES } from "../constants";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateMasterDataRequest } from "@/shared/validation/master-data.schema";

export function useUpdateMasterData() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: UpdateMasterDataRequest) => updateMasterDataAction(data),
    onSuccess: (_, variables) => {
      notify.success(MASTER_DATA_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: MASTER_DATA_QUERY_KEYS.byId(variables.id),
        refetchType: "active",
      });
      qc.invalidateQueries({
        queryKey: ["master-data"],
        refetchType: "active",
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
