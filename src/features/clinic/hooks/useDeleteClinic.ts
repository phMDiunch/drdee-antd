"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { deleteClinicApi } from "../api";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";

export function useDeleteClinic(includeArchived?: boolean) {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => deleteClinicApi(id),
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({
        queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
