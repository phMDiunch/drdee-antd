// src/features/dental-services/api/createDentalService.ts

import { DENTAL_SERVICE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  UpdateDentalServiceRequestSchema,
  DentalServiceResponseSchema,
} from "@/shared/validation/dental-service.schema";

export async function updateDentalServiceApi(id: string, payload: unknown) {
  const body = UpdateDentalServiceRequestSchema.parse({
    ...(payload as any),
    id,
  });
  const res = await fetch(DENTAL_SERVICE_ENDPOINTS.BY_ID(id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = DentalServiceResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi cập nhật dịch vụ không hợp lệ.");
  return parsed.data;
}
