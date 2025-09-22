"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { unarchiveClinicApi } from "../api";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";

export function useUnarchiveClinic(includeArchived?: boolean) {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => unarchiveClinicApi(id),
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({
        queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
