// src/features/dental-services/api/getDentalServices.ts

import { DENTAL_SERVICE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { DentalServicesResponseSchema } from "@/shared/validation/dental-service.schema";

export async function getDentalServicesApi(includeArchived: boolean) {
  const url = `${DENTAL_SERVICE_ENDPOINTS.ROOT}?includeArchived=${
    includeArchived ? "1" : "0"
  }`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = DentalServicesResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách dịch vụ không hợp lệ.");
  return parsed.data;
}
