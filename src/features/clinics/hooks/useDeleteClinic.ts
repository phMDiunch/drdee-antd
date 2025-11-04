"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { archiveClinicAction } from "@/server/actions/clinic.actions";
import { CLINIC_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => archiveClinicAction(id),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
