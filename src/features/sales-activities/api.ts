// src/features/sales-activities/api.ts
/**
 * Sales Activity API Client
 * Consolidated API functions for sales activity operations
 */

import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  SalesActivitiesListResponseSchema,
  DailySalesActivitiesResponseSchema,
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

/**
 * Get daily sales activities with statistics
 * GET /api/v1/sales-activities/daily
 * @param params - Query parameters (date: YYYY-MM-DD, clinicId: UUID)
 * @returns Daily sales activities with statistics
 */
export async function getDailySalesActivitiesApi(params: {
  date: string;
  clinicId: string;
}) {
  const queryParams: Record<string, string> = {
    date: params.date,
    clinicId: params.clinicId,
  };

  const query = new URLSearchParams(queryParams);

  const res = await fetch(`/api/v1/sales-activities/daily?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = DailySalesActivitiesResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu hoạt động liên hệ hàng ngày không hợp lệ.");
  }

  return parsed.data;
}
