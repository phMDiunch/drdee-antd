// src/features/appointments/hooks/useCreateAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createAppointmentApi } from "../api/createAppointment";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useCreateAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (body: unknown) => createAppointmentApi(body),
    onSuccess: () => {
      notify.success(APPOINTMENT_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
