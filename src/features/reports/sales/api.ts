// src/features/reports/sales/api.ts
/**
 * Sales Report API Client
 * Consolidated API functions for sales report operations
 */

import {
  SalesSummaryResponseSchema,
  SalesDetailResponseSchema,
} from "@/shared/validation/sales-report.schema";
import type {
  GetSalesSummaryQuery,
  GetSalesDetailQuery,
  SalesSummaryResponse,
  SalesDetailResponse,
} from "@/shared/validation/sales-report.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * Get sales summary (KPI + tabs data)
 * GET /api/v1/reports/sales/summary
 * @param params - Query parameters (month, clinicId)
 * @returns Sales summary with KPI cards and summary tabs data
 */
export async function getSalesSummaryApi(
  params: GetSalesSummaryQuery
): Promise<SalesSummaryResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }

  const res = await fetch(`/api/v1/reports/sales/summary?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = SalesSummaryResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu báo cáo doanh số không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get sales detail records for a specific tab/key
 * GET /api/v1/reports/sales/detail
 * @param params - Query parameters (month, clinicId, tab, key)
 * @returns List of consulted service detail records for the selected summary row
 */
export async function getSalesDetailApi(
  params: GetSalesDetailQuery
): Promise<SalesDetailResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }
  query.set("tab", params.tab);
  query.set("key", params.key);

  const res = await fetch(`/api/v1/reports/sales/detail?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = SalesDetailResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu chi tiết báo cáo không hợp lệ.");
  }

  return parsed.data;
}
