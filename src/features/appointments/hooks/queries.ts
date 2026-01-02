// src/features/appointments/hooks/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAppointmentsApi,
  getAppointmentsDailyApi,
  getAppointmentApi,
  checkDentistAvailabilityApi,
} from "../api";
import { APPOINTMENT_QUERY_KEYS } from "../constants";
import type {
  GetAppointmentsQuery,
  GetAppointmentsDailyQuery,
  CheckDentistAvailabilityQuery,
} from "@/shared/validation/appointment.schema";

/**
 * Hook: Fetch appointments list with optional filters
 * Cache: 1 minute stale time, 5 minutes garbage collection
 * Refetch: On window focus
 * Invalidated by: useCreateAppointment, useUpdateAppointment, useDeleteAppointment
 */
export function useAppointments(params?: GetAppointmentsQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.list(params),
    queryFn: () => getAppointmentsApi(params),
    staleTime: 60 * 1000, // 1 phút - Transaction data thay đổi thường xuyên
    gcTime: 5 * 60 * 1000, // 5 phút - Giữ trong memory
    refetchOnWindowFocus: true, // Refetch khi user quay lại tab (nhưng vẫn show cache trước)
  });
}

/**
 * Hook: Fetch daily appointments by date and clinic
 * Cache: 1 minute stale time, auto-refetch every 2 minutes
 * Invalidated by: useCreateAppointment, useUpdateAppointment, useDeleteAppointment
 */
export function useAppointmentsDaily(params?: GetAppointmentsDailyQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.daily(params?.date, params?.clinicId),
    queryFn: () => getAppointmentsDailyApi(params),
    staleTime: 1 * 60 * 1000, // 1 minute (real-time data)
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
}

/**
 * Hook: Fetch single appointment by ID
 * Cache: 2 minutes stale time
 * Enabled: Only when ID is provided
 * Invalidated by: useUpdateAppointment, useDeleteAppointment
 */
export function useAppointment(id: string) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.byId(id),
    queryFn: () => getAppointmentApi(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook: Check dentist availability for appointment scheduling
 * Cache: Always fresh (staleTime: 0)
 * Enabled: Only when all required params provided (dentistId, datetime, duration)
 */
export function useDentistAvailability(params?: CheckDentistAvailabilityQuery) {
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.checkAvailability(params),
    queryFn: () => checkDentistAvailabilityApi(params!),
    enabled: !!params?.dentistId && !!params?.datetime && !!params?.duration,
    staleTime: 0, // Always fresh (real-time check)
  });
}
