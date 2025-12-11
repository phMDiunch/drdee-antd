// src/features/reports/labo/api.ts
/**
 * Labo Report API Client
 * Consolidated API functions for labo report operations
 */

import type {
  GetLaboReportSummaryQuery,
  GetLaboReportDetailQuery,
  LaboReportSummaryResponse,
  LaboReportDetailResponse,
} from "@/shared/validation/labo-report.schema";
import {
  LaboReportSummaryResponseSchema,
  LaboReportDetailResponseSchema,
} from "@/shared/validation/labo-report.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * Get labo report summary (KPI + 4 dimension tabs)
 * GET /api/v1/reports/labo/summary
 * @param params - Query parameters (month, clinicId)
 * @returns Labo summary with KPI cards and summary tabs data
 */
export async function getLaboReportSummaryApi(
  params: GetLaboReportSummaryQuery
): Promise<LaboReportSummaryResponse> {
  const queryParams: Record<string, string> = { month: params.month };
  if (params.clinicId) {
    queryParams.clinicId = params.clinicId;
  }
  const query = new URLSearchParams(queryParams);
  const res = await fetch(`/api/v1/reports/labo/summary?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = LaboReportSummaryResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu báo cáo labo không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get labo report detail records for a specific tab/key
 * GET /api/v1/reports/labo/detail
 * @param params - Query parameters (month, clinicId, tab, key)
 * @returns List of labo order detail records for the selected summary row
 */
export async function getLaboReportDetailApi(
  params: GetLaboReportDetailQuery
): Promise<LaboReportDetailResponse> {
  const queryParams: Record<string, string> = {
    month: params.month,
    tab: params.tab,
    key: params.key,
  };
  if (params.clinicId) {
    queryParams.clinicId = params.clinicId;
  }
  const query = new URLSearchParams(queryParams);
  const res = await fetch(`/api/v1/reports/labo/detail?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = LaboReportDetailResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu chi tiết báo cáo labo không hợp lệ.");
  }

  return parsed.data;
}
