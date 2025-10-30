// src/features/appointments/hooks/useAppointment.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentApi } from "../api/getAppointment";
import { APPOINTMENT_QUERY_KEYS } from "../constants";

export function useAppointment(id: string) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.byId(id),
    queryFn: () => getAppointmentApi(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
