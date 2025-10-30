// src/features/appointments/hooks/useUpdateAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateAppointmentApi } from "../api/updateAppointment";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) =>
      updateAppointmentApi(id, body),
    onSuccess: (_, variables) => {
      // Detect action type from body to show appropriate message
      const body = variables.body as Record<string, unknown>;

      if (body.checkInTime && !body.checkOutTime) {
        notify.success(APPOINTMENT_MESSAGES.CHECKIN_SUCCESS);
      } else if (body.checkOutTime) {
        notify.success(APPOINTMENT_MESSAGES.CHECKOUT_SUCCESS);
      } else if (body.status === "Đã xác nhận") {
        notify.success(APPOINTMENT_MESSAGES.CONFIRM_SUCCESS);
      } else if (body.status === "Không đến") {
        notify.success(APPOINTMENT_MESSAGES.MARK_NO_SHOW_SUCCESS);
      } else {
        notify.success(APPOINTMENT_MESSAGES.UPDATE_SUCCESS);
      }

      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment"] });
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
