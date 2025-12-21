// src/features/sales-activities/api.ts
/**
 * Sales Activity API Client
 * Consolidated API functions for sales activity operations
 */

import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  SalesActivitiesListResponseSchema,
  type GetSalesActivitiesQuery,
} from "@/shared/validation/sales-activity.schema";

/**
 * Get sales activities list with filters
 * GET /api/v1/sales-activities
 * @param params - Query parameters (customerId, consultedServiceId, saleId, pageSize, sortField, sortDirection)
 * @returns List of sales activities with total count
 */
export async function getSalesActivitiesApi(params?: GetSalesActivitiesQuery) {
  const queryParams: Record<string, string> = {};

  if (params?.customerId) queryParams.customerId = params.customerId;
  if (params?.consultedServiceId)
    queryParams.consultedServiceId = params.consultedServiceId;
  if (params?.saleId) queryParams.saleId = params.saleId;
  if (params?.pageSize) queryParams.pageSize = params.pageSize.toString();
  if (params?.sortField) queryParams.sortField = params.sortField;
  if (params?.sortDirection) queryParams.sortDirection = params.sortDirection;

  const query = new URLSearchParams(queryParams);

  const res = await fetch(`/api/v1/sales-activities?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = SalesActivitiesListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu hoạt động liên hệ không hợp lệ.");
  }

  return parsed.data;
}
