// src/features/dental-services/api/archiveDentalService.ts

import { DENTAL_SERVICE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { DentalServiceResponseSchema } from "@/shared/validation/dental-service.schema";

export async function archiveDentalServiceApi(id: string) {
  const res = await fetch(DENTAL_SERVICE_ENDPOINTS.ARCHIVE(id), {
    method: "POST",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = DentalServiceResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi archive dịch vụ không hợp lệ.");
  return parsed.data;
}
