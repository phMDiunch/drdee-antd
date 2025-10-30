// src/features/appointments/api/checkDentistAvailability.ts
import {
  DentistAvailabilityResponseSchema,
  type CheckDentistAvailabilityQuery,
} from "@/shared/validation/appointment.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { APPOINTMENT_ENDPOINTS } from "../constants";

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
