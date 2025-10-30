// src/features/appointments/hooks/useAppointmentsDaily.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentsDailyApi } from "../api/getAppointmentsDaily";
import { APPOINTMENT_QUERY_KEYS } from "../constants";
import type { GetAppointmentsDailyQuery } from "@/shared/validation/appointment.schema";

export function useAppointmentsDaily(params?: GetAppointmentsDailyQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.daily(params?.date, params?.clinicId),
    queryFn: () => getAppointmentsDailyApi(params),
    staleTime: 1 * 60 * 1000, // 1 minute (real-time data)
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}
