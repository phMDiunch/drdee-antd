import { CLINIC_ENDPOINTS } from "../constants";
import { ClinicResponseSchema } from "@/shared/validation/clinic.schema";

export async function getClinicByIdApi(id: string) {
  const res = await fetch(CLINIC_ENDPOINTS.BY_ID(id), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Không lấy được phòng khám.");
  const parsed = ClinicResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi phòng khám không hợp lệ.");
  return parsed.data;
}
