import { CLINIC_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  UpdateClinicRequestSchema,
  ClinicResponseSchema,
} from "@/shared/validation/clinic.schema";

export async function updateClinicApi(id: string, payload: unknown) {
  const body = UpdateClinicRequestSchema.parse({ ...(payload as any), id });

  const res = await fetch(CLINIC_ENDPOINTS.BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi cập nhật phòng khám không hợp lệ.");
  return parsed.data;
}
