// src/features/master-data/hooks/useToggleMasterDataActive.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { toggleMasterDataActiveAction } from "@/server/actions/master-data.actions";
import { MASTER_DATA_MESSAGES } from "../constants";
import { MASTER_DATA_QUERY_KEYS } from "@/shared/constants/master-data";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useToggleMasterDataActive() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleMasterDataActiveAction(id, isActive),
    onSuccess: (_, variables) => {
      notify.success(
        variables.isActive
          ? MASTER_DATA_MESSAGES.ACTIVATE_SUCCESS
          : MASTER_DATA_MESSAGES.DEACTIVATE_SUCCESS
      );
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
