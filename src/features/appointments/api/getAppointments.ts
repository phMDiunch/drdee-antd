// src/features/appointments/api/getAppointments.ts
import {
  AppointmentsListResponseSchema,
  type GetAppointmentsQuery,
} from "@/shared/validation/appointment.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

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
