// src/features/appointments/hooks/useAppointments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentsApi } from "../api/getAppointments";
import { APPOINTMENT_QUERY_KEYS } from "../constants";
import type { GetAppointmentsQuery } from "@/shared/validation/appointment.schema";

export function useAppointments(params?: GetAppointmentsQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.list(params),
    queryFn: () => getAppointmentsApi(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
