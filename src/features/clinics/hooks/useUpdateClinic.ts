"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateClinicApi } from "../api";
import { CLINIC_MESSAGES, CLINIC_QUERY_KEYS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUpdateClinic(id: string) {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (payload: unknown) => updateClinicApi(id, payload),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.UPDATE_SUCCESS);
      qc.invalidateQueries({ queryKey: CLINIC_QUERY_KEYS.byId(id) });
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: any) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
