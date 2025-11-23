// src/features/suppliers/api.ts
/**
 * Supplier API Client
 * Consolidated API functions for supplier operations
 */

import {
  SuppliersResponseSchema,
  SupplierResponseSchema,
} from "@/shared/validation/supplier.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { SUPPLIER_ENDPOINTS } from "./constants";

/**
 * Get suppliers list
 * GET /api/v1/suppliers
 * @param includeArchived - Include archived suppliers in the list
 * @returns Array of suppliers
 */
export async function getSuppliersApi(includeArchived: boolean) {
  const url = `${SUPPLIER_ENDPOINTS.ROOT}?includeArchived=${
    includeArchived ? "1" : "0"
  }`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = SuppliersResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi danh sách nhà cung cấp không hợp lệ.");
  return parsed.data;
}

/**
 * Get supplier detail by ID
 * GET /api/v1/suppliers/[id]
 * @param id - Supplier ID
 * @returns Full supplier detail
 */
export async function getSupplierByIdApi(id: string) {
  const res = await fetch(SUPPLIER_ENDPOINTS.BY_ID(id), {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  const parsed = SupplierResponseSchema.safeParse(json);
  if (!parsed.success)
    throw new Error("Phản hồi chi tiết nhà cung cấp không hợp lệ.");
  return parsed.data;
}
