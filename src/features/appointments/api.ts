// src/features/appointments/api.ts
/**
 * Appointment API Client
 * Consolidated API functions for appointment operations
 */

import { z } from "zod";
import {
  AppointmentsListResponseSchema,
  AppointmentResponseSchema,
  DentistAvailabilityResponseSchema,
} from "@/shared/validation/appointment.schema";
import type {
  GetAppointmentsQuery,
  GetAppointmentsDailyQuery,
  CheckDentistAvailabilityQuery,
} from "@/shared/validation/appointment.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "./constants";

// Local schema for daily appointments
const DailyResponseSchema = z.object({
  items: z.array(AppointmentResponseSchema),
  count: z.number(),
});

/**
 * Get appointments list
 * GET /api/v1/appointments
 * @param params - Query parameters (search, date, clinicId, status, customerId, primaryDentistId, page, pageSize)
 * @returns Paginated list of appointments
 */
export async function getAppointmentsApi(params?: GetAppointmentsQuery) {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const url = `${APPOINTMENT_ENDPOINTS.ROOT}?${searchParams.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = AppointmentsListResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Dữ liệu danh sách lịch hẹn trả về không hợp lệ.");

  return parsed.data;
}

/**
 * Get appointment detail by ID
 * GET /api/v1/appointments/[id]
 * @param id - Appointment ID
 * @returns Full appointment detail with relations
 */
export async function getAppointmentApi(id: string) {
  const res = await fetch(APPOINTMENT_ENDPOINTS.BY_ID(id), {
    method: "GET",
  });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = AppointmentResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Dữ liệu lịch hẹn trả về không hợp lệ.");

  return parsed.data;
}

/**
 * Get appointments for specific date
 * GET /api/v1/appointments/daily
 * @param params - Query parameters (date, clinicId)
 * @returns List of appointments for the specified date
 */
export async function getAppointmentsDailyApi(
  params?: GetAppointmentsDailyQuery
) {
  const searchParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const url = `${APPOINTMENT_ENDPOINTS.DAILY}?${searchParams.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  // Response is { items, count } from service layer
  const parsed = DailyResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Dữ liệu lịch hẹn hàng ngày trả về không hợp lệ.");

  return parsed.data; // Return full object { items, count }
}

/**
 * Check dentist availability
 * GET /api/v1/appointments/check-availability
 * @param params - Query parameters (dentistId, appointmentDateTime, excludeAppointmentId)
 * @returns Dentist availability status
 */
export async function checkDentistAvailabilityApi(
  params: CheckDentistAvailabilityQuery
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const url = `${
    APPOINTMENT_ENDPOINTS.CHECK_AVAILABILITY
  }?${searchParams.toString()}`;
  const res = await fetch(url, { method: "GET" });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = DentistAvailabilityResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Dữ liệu kiểm tra khả dụng trả về không hợp lệ.");

  return parsed.data;
}
