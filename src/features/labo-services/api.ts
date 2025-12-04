// src/features/labo-services/api.ts
/**
 * Labo Service API Client
 * Consolidated API functions for labo service operations
 */

import {
  LaboServicesResponseSchema,
  LaboServiceResponseSchema,
} from "@/shared/validation/labo-service.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { LABO_SERVICE_ENDPOINTS } from "./constants";

/**
 * Get labo services list
 * GET /api/v1/labo-services
 * @param params - Query parameters (sortBy, sortOrder, supplierId)
 * @returns Array of labo services
 */
export async function getLaboServicesApi(params?: {
  sortBy?: string;
  sortOrder?: string;
  supplierId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params?.supplierId) query.set("supplierId", params.supplierId);

  const url = `${LABO_SERVICE_ENDPOINTS.ROOT}?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = LaboServicesResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách bảng giá không hợp lệ.");
  return parsed.data;
}

/**
 * Get labo service detail by ID
 * GET /api/v1/labo-services/[id]
 * @param id - Supplier labo price ID
 * @returns Full labo service detail
 */
export async function getLaboServiceByIdApi(id: string) {
  const res = await fetch(LABO_SERVICE_ENDPOINTS.BY_ID(id), {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = LaboServiceResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi chi tiết bảng giá không hợp lệ.");
  return parsed.data;
}
