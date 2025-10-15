import { CLINIC_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  CreateClinicRequestSchema,
  ClinicResponseSchema,
} from "@/shared/validation/clinic.schema";

export async function createClinicApi(payload: unknown) {
  // validate client (optional nhưng hữu ích)
  const body = CreateClinicRequestSchema.parse(payload);

  const res = await fetch(CLINIC_ENDPOINTS.ROOT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi tạo phòng khám không hợp lệ.");
  return parsed.data;
}
