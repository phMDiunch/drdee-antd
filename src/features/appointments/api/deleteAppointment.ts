// src/features/appointments/api/deleteAppointment.ts
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

export async function deleteAppointmentApi(id: string) {
  const res = await fetch(APPOINTMENT_ENDPOINTS.BY_ID(id), {
    method: "DELETE",
  });
  const json = await res.json();

  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  return json;
}
