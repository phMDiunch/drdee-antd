// src/features/reports/revenue/api.ts
/**
 * Revenue Report API Client
 * Consolidated API functions for revenue report operations
 */

import {
  RevenueSummaryResponseSchema,
  RevenueDetailResponseSchema,
} from "@/shared/validation/revenue-report.schema";
import type {
  GetRevenueSummaryQuery,
  GetRevenueDetailQuery,
  RevenueSummaryResponse,
  RevenueDetailResponse,
} from "@/shared/validation/revenue-report.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * Get revenue summary (KPI + tabs data)
 * GET /api/v1/reports/revenue/summary
 * @param params - Query parameters (month, clinicId)
 * @returns Revenue summary with KPI cards and summary tabs data
 */
export async function getRevenueSummaryApi(
  params: GetRevenueSummaryQuery
): Promise<RevenueSummaryResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }

  const res = await fetch(`/api/v1/reports/revenue/summary?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = RevenueSummaryResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu báo cáo doanh thu không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get revenue detail records for a specific tab/key
 * GET /api/v1/reports/revenue/detail
 * @param params - Query parameters (month, clinicId, tab, key)
 * @returns List of payment detail records for the selected summary row
 */
export async function getRevenueDetailApi(
  params: GetRevenueDetailQuery
): Promise<RevenueDetailResponse> {
  const query = new URLSearchParams();
  query.set("month", params.month);
  if (params.clinicId) {
    query.set("clinicId", params.clinicId);
  }
  query.set("tab", params.tab);
  query.set("key", params.key);

  const res = await fetch(`/api/v1/reports/revenue/detail?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = RevenueDetailResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu chi tiết doanh thu không hợp lệ.");
  }

  return parsed.data;
}
