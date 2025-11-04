// src/features/appointments/hooks/useDeleteAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { deleteAppointmentAction } from "@/server/actions/appointment.actions";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (id: string) => deleteAppointmentAction(id),
    onSuccess: () => {
      notify.success(APPOINTMENT_MESSAGES.DELETE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
