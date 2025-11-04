// src/features/clinics/hooks/useCreateClinic.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createClinicAction } from "@/server/actions/clinic.actions";
import { CLINIC_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { CreateClinicRequest } from "@/shared/validation/clinic.schema";

export function useCreateClinic() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateClinicRequest) => createClinicAction(data),
    onSuccess: () => {
      notify.success(CLINIC_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({
        queryKey: ["clinics"],
      });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
