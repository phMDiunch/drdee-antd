// src/features/dental-services/api/createDentalService.ts

import { DENTAL_SERVICE_ENDPOINTS } from "../constants";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  CreateDentalServiceRequestSchema,
  DentalServiceResponseSchema,
} from "@/shared/validation/dental-service.schema";

export async function createDentalServiceApi(payload: unknown) {
  const body = CreateDentalServiceRequestSchema.parse(payload);
  const res = await fetch(DENTAL_SERVICE_ENDPOINTS.ROOT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = DentalServiceResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi tạo dịch vụ không hợp lệ.");
  return parsed.data;
}
