import { CLINIC_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { ClinicResponseSchema } from "@/shared/validation/clinic.schema";

export async function deleteClinicApi(id: string) {
  const res = await fetch(CLINIC_ENDPOINTS.BY_ID(id), {
    method: "DELETE",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi xoá phòng khám không hợp lệ.");
  return parsed.data;
}
