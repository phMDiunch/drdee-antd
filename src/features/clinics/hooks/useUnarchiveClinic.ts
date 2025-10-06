"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { unarchiveClinicApi } from "../api";
import { CLINIC_MESSAGES } from "../constants";

export function useUnarchiveClinic() {
  const qc = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: (id: string) => unarchiveClinicApi(id),
    onSuccess: () => {
      message.success(CLINIC_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: any) =>
      message.error(e?.message || CLINIC_MESSAGES.UNKNOWN_ERROR),
  });
}
