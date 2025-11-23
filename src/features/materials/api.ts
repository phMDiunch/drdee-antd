// src/features/materials/api.ts
/**
 * Material API Client
 * Consolidated API functions for material operations
 */

import {
  MaterialsResponseSchema,
  MaterialResponseSchema,
} from "@/shared/validation/material.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { MATERIAL_ENDPOINTS } from "./constants";

/**
 * Get materials list
 * GET /api/v1/materials
 * @param includeArchived - Include archived materials in the list
 * @returns Array of materials
 */
export async function getMaterialsApi(includeArchived: boolean) {
  const url = `${MATERIAL_ENDPOINTS.ROOT}?includeArchived=${
    includeArchived ? "1" : "0"
  }`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = MaterialsResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách vật tư không hợp lệ.");
  return parsed.data;
}

/**
 * Get material detail by ID
 * GET /api/v1/materials/[id]
 * @param id - Material ID
 * @returns Full material detail
 */
export async function getMaterialByIdApi(id: string) {
  const res = await fetch(MATERIAL_ENDPOINTS.BY_ID(id), { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = MaterialResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi chi tiết vật tư không hợp lệ.");
  return parsed.data;
}
