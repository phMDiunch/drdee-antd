"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { unarchiveClinicApi } from "../api/unarchiveClinic";
import { CLINIC_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUnarchiveClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => unarchiveClinicApi(id),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.UNARCHIVE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: unknown) => notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
