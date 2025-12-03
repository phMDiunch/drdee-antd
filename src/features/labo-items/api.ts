// src/features/labo-items/api.ts
/**
 * Labo Item API Client
 * Consolidated API functions for labo item operations
 */

import {
  LaboItemsResponseSchema,
  LaboItemResponseSchema,
} from "@/shared/validation/labo-item.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { LABO_ITEM_ENDPOINTS } from "./constants";

/**
 * Get labo items list
 * GET /api/v1/labo-items
 * @param includeArchived - Include archived labo items in the list
 * @returns Array of labo items
 */
export async function getLaboItemsApi(includeArchived: boolean) {
  const url = `${LABO_ITEM_ENDPOINTS.ROOT}?includeArchived=${
    includeArchived ? "1" : "0"
  }`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = LaboItemsResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách hàng labo không hợp lệ.");
  return parsed.data;
}

/**
 * Get labo item detail by ID
 * GET /api/v1/labo-items/[id]
 * @param id - Labo item ID
 * @returns Full labo item detail
 */
export async function getLaboItemByIdApi(id: string) {
  const res = await fetch(LABO_ITEM_ENDPOINTS.BY_ID(id), {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = LaboItemResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi chi tiết hàng labo không hợp lệ.");
  return parsed.data;
}
