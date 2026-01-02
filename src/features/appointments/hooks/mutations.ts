// src/features/appointments/hooks/mutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNotify } from "@/shared/hooks/useNotify";
import {
  createAppointmentAction,
  updateAppointmentAction,
  deleteAppointmentAction,
} from "@/server/actions/appointment.actions";
import { APPOINTMENT_MESSAGES } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import type {
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
} from "@/shared/validation/appointment.schema";

/**
 * Hook: Create new appointment
 * Invalidates: appointments, consulted-services (if walk-in with checkInTime)
 * Special: Auto-binds pending consulted services on walk-in check-in
 */
export function useCreateAppointment() {
  const qc = useQueryClient();
  const notify = useNotify();

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      createAppointmentAction(data),
    onSuccess: (_, variables) => {
      notify.success(APPOINTMENT_MESSAGES.CREATE_SUCCESS);
      qc.invalidateQueries({ queryKey: ["appointments"] });

      // If walk-in (checkInTime provided), invalidate consulted-services
      // because backend auto-binds pending services
      if (variables.checkInTime) {
        qc.invalidateQueries({ queryKey: ["consulted-services"] });
      }
    },
    onError: (e: unknown) =>
      notify.error(e, { fallback: COMMON_MESSAGES.UNKNOWN_ERROR }),
  });
}

/**
 * Hook: Update existing appointment
 * Invalidates: appointments, appointment (single), consulted-services (on check-in)
 * Special: Different messages for check-in, check-out, confirm, and regular update
 * Auto-binds pending consulted services on check-in
 */
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

/**
 * Hook: Delete appointment
 * Invalidates: appointments
 */
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
