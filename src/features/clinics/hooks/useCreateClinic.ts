"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { createClinicApi } from "../api";
import { CLINIC_MESSAGES } from "../constants";

export function useCreateClinic() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: createClinicApi,
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
