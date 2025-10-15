"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createClinicApi } from "../api";
import { CLINIC_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: createClinicApi,
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: unknown) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
