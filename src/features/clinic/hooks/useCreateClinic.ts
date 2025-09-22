"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { createClinicApi } from "../api";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";

export function useCreateClinic(includeArchived?: boolean) {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: createClinicApi,
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: CLINIC_QUERY_KEYS.list(includeArchived),
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
