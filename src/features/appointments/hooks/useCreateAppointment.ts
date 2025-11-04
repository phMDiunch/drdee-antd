// src/features/appointments/hooks/useCreateAppointment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import { createAppointmentAction } from "@/server/actions/appointment.actions";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateAppointmentRequest,
  AppointmentResponse,
} from "@/shared/validation/appointment.schema";

export function useCreateAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      createAppointmentAction(data),

    // 🎯 OPTIMISTIC UPDATE: Insert appointment vào cache NGAY LẬP TỨC
    onMutate: async (newAppointmentData) => {
      // 1. Cancel các queries đang pending
      await qc.cancelQueries({ queryKey: ["appointments"] });

      // 2. Snapshot data hiện tại
      const previousAppointments = qc.getQueryData<AppointmentResponse[]>([
        "appointments",
      ]);

      // 3. Optimistically insert appointment mới
      if (previousAppointments) {
        const optimisticAppointment: AppointmentResponse = {
          id: `temp-${Date.now()}`,
          ...newAppointmentData,
          notes: newAppointmentData.notes ?? null,
          secondaryDentistId: newAppointmentData.secondaryDentistId ?? null,
          appointmentDateTime:
            newAppointmentData.appointmentDateTime.toISOString(),
          status: "Chờ xác nhận",
          checkInTime: null,
          checkOutTime: null,
          createdById: "",
          updatedById: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // Minimal relations - server sẽ trả về data đầy đủ
          customer: {
            id: newAppointmentData.customerId,
            customerCode: null,
            fullName: "",
            phone: null,
            dob: null,
          },
          primaryDentist: {
            id: newAppointmentData.primaryDentistId,
            fullName: "",
            employeeCode: null,
          },
          secondaryDentist: newAppointmentData.secondaryDentistId
            ? {
                id: newAppointmentData.secondaryDentistId,
                fullName: "",
                employeeCode: null,
              }
            : null,
          clinic: {
            id: newAppointmentData.clinicId,
            clinicCode: "",
            name: "",
            colorCode: null,
          },
          createdBy: { id: "", fullName: "" },
          updatedBy: { id: "", fullName: "" },
        };

        qc.setQueryData<AppointmentResponse[]>(
          ["appointments"],
          [optimisticAppointment, ...previousAppointments]
        );
      }

      return { previousAppointments };
    },

    // ✅ SUCCESS: Show notification & sync
    onSuccess: () => {
      notify.success(APPOINTMENT_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["appointments"] });
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
