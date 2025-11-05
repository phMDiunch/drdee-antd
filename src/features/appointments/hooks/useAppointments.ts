// src/features/appointments/hooks/useAppointments.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAppointmentsApi } from "../api";
import { APPOINTMENT_QUERY_KEYS } from "../constants";
import type { GetAppointmentsQuery } from "@/shared/validation/appointment.schema";

export function useAppointments(params?: GetAppointmentsQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.list(params),
    queryFn: () => getAppointmentsApi(params),
    staleTime: 60 * 1000, // 1 phút - Transaction data thay đổi thường xuyên
    gcTime: 5 * 60 * 1000, // 5 phút - Giữ trong memory
    refetchOnWindowFocus: true, // Refetch khi user quay lại tab (nhưng vẫn show cache trước)
  });
}
