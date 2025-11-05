// src/features/appointments/hooks/useDentistAvailability.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { checkDentistAvailabilityApi } from "../api";
import { APPOINTMENT_QUERY_KEYS } from "../constants";
import type { CheckDentistAvailabilityQuery } from "@/shared/validation/appointment.schema";

export function useDentistAvailability(params?: CheckDentistAvailabilityQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.checkAvailability(params),
    queryFn: () => checkDentistAvailabilityApi(params!),
    enabled: !!params?.dentistId && !!params?.datetime && !!params?.duration,
    staleTime: 0, // Always fresh (real-time check)
  });
}
