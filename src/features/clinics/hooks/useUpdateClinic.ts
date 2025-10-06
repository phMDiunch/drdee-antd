"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { updateClinicApi } from "../api";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";

export function useUpdateClinic(id: string) {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (payload: unknown) => updateClinicApi(id, payload),
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: CLINIC_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
