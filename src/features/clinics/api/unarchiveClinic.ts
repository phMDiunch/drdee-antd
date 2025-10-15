import { CLINIC_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { ClinicResponseSchema } from "@/shared/validation/clinic.schema";

export async function unarchiveClinicApi(id: string) {
  const res = await fetch(CLINIC_ENDPOINTS.UNARCHIVE(id), {
    method: "POST",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi unarchive không hợp lệ.");
  return parsed.data;
}
