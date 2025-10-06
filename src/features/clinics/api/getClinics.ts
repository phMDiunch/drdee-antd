import { CLINIC_ENDPOINTS } from "../constants";
import { ClinicsResponseSchema } from "@/shared/validation/clinic.schema";

export async function getClinicsApi(includeArchived?: boolean) {
  const qs = includeArchived ? "?includeArchived=1" : "";
  const res = await fetch(`${CLINIC_ENDPOINTS.ROOT}${qs}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.error || "Không lấy được danh sách phòng khám.");
  const parsed = ClinicsResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách phòng khám không hợp lệ.");
  return parsed.data;
}
