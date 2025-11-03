// src/features/appointments/api/getAppointment.ts
import { AppointmentResponseSchema } from "@/shared/validation/appointment.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

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
