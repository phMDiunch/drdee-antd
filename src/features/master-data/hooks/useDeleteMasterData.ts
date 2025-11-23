// src/features/master-data/hooks/useDeleteMasterData.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteMasterDataAction } from "@/server/actions/master-data.actions";
import { MASTER_DATA_MESSAGES } from "../constants";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteMasterData() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteMasterDataAction(id),
    onSuccess: () => {
      notify.success(MASTER_DATA_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["master-data"],
        refetchType: "active",
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
