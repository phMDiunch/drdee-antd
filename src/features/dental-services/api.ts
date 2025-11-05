// src/features/dental-services/api.ts
/**
 * Dental Service API Client
 * Consolidated API functions for dental service operations
 */

import {
  DentalServicesResponseSchema,
  DentalServiceResponseSchema,
} from "@/shared/validation/dental-service.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { DENTAL_SERVICE_ENDPOINTS } from "./constants";

/**
 * Get dental services list
 * GET /api/v1/dental-services
 * @param includeArchived - Include archived dental services in the list
 * @returns Array of dental services
 */
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

/**
 * Get dental service detail by ID
 * GET /api/v1/dental-services/[id]
 * @param id - Dental service ID
 * @returns Full dental service detail
 */
export async function getDentalServiceByIdApi(id: string) {
  const res = await fetch(DENTAL_SERVICE_ENDPOINTS.BY_ID(id), {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = DentalServiceResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi chi tiết dịch vụ không hợp lệ.");
  return parsed.data;
}
