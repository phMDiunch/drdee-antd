// src/features/appointments/hooks/useUpdateAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { updateAppointmentAction } from "@/server/actions/appointment.actions";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  UpdateAppointmentRequest,
  AppointmentResponse,
} from "@/shared/validation/appointment.schema";

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

    // 🎯 OPTIMISTIC UPDATE: Update appointment trong cache NGAY LẬP TỨC
    onMutate: async ({ id, body }) => {
      // 1. Cancel queries đang pending
      await qc.cancelQueries({ queryKey: ["appointments"] });

      // 2. Snapshot data hiện tại
      const previousAppointments = qc.getQueryData<AppointmentResponse[]>([
        "appointments",
      ]);

      // 3. Optimistically update cache
      if (previousAppointments) {
        qc.setQueryData<AppointmentResponse[]>(
          ["appointments"],
          previousAppointments.map((apt) => {
            if (apt.id === id) {
              return {
                ...apt,
                ...body,
                appointmentDateTime:
                  body.appointmentDateTime instanceof Date
                    ? body.appointmentDateTime.toISOString()
                    : body.appointmentDateTime ?? apt.appointmentDateTime,
                checkInTime:
                  body.checkInTime instanceof Date
                    ? body.checkInTime.toISOString()
                    : body.checkInTime ?? apt.checkInTime,
                checkOutTime:
                  body.checkOutTime instanceof Date
                    ? body.checkOutTime.toISOString()
                    : body.checkOutTime ?? apt.checkOutTime,
                updatedAt: new Date().toISOString(),
              };
            }
            return apt;
          })
        );
      }

      return { previousAppointments };
    },

    // ✅ SUCCESS: Show notification & sync
    onSuccess: (_, variables) => {
      const body = variables.body;

      // Detect action type to show appropriate message
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

    // ❌ ERROR: Rollback
    onError: (e: unknown, _variables, context) => {
      if (context?.previousAppointments) {
        qc.setQueryData(["appointments"], context.previousAppointments);
      }
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR });
    },
  });
}
