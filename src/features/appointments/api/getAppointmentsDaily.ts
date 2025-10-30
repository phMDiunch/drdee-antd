// src/features/appointments/api/getAppointmentsDaily.ts
import {
  AppointmentResponseSchema,
  type GetAppointmentsDailyQuery,
} from "@/shared/validation/appointment.schema";
import { z } from "zod";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

// Response schema matching service layer
const DailyResponseSchema = z.object({
  items: z.array(AppointmentResponseSchema),
  count: z.number(),
});

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
