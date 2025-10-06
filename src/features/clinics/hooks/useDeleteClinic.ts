"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { deleteClinicApi } from "../api";
import { CLINIC_MESSAGES } from "../constants";

export function useDeleteClinic() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => deleteClinicApi(id),
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
