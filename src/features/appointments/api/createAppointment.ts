// src/features/appointments/api/createAppointment.ts
import { AppointmentResponseSchema } from "@/shared/validation/appointment.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

export async function createAppointmentApi(body: unknown) {
  const res = await fetch(APPOINTMENT_ENDPOINTS.ROOT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = AppointmentResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Dữ liệu lịch hẹn trả về không hợp lệ.");

  return parsed.data;
}
