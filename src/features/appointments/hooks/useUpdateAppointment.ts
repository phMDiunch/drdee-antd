// src/features/appointments/hooks/useUpdateAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateAppointmentAction } from "@/server/actions/appointment.actions";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type { UpdateAppointmentRequest } from "@/shared/validation/appointment.schema";

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateAppointmentRequest;
    }) => updateAppointmentAction(id, body),
    onSuccess: (_, variables) => {
      const body = variables.body;

      // Detect action type to show appropriate message
      if (body.checkInTime && !body.checkOutTime) {
        notify.success(APPOINTMENT_MESSAGES.CHECKIN_SUCCESS);
      } else if (body.checkOutTime) {
        notify.success(APPOINTMENT_MESSAGES.CHECKOUT_SUCCESS);
      } else if (body.status === "Đã xác nhận") {
        notify.success(APPOINTMENT_MESSAGES.CONFIRM_SUCCESS);
      } else {
        notify.success(APPOINTMENT_MESSAGES.UPDATE_SUCCESS);
      }

      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["appointment"] });

      // If checking in, invalidate consulted-services
      // because backend auto-binds pending services
      if (body.checkInTime && !body.checkOutTime) {
        qc.invalidateQueries({ queryKey: ["consulted-services"] });
      }
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}
