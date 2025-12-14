// src/features/leads/api.ts
/**
 * Lead API Client
 * API functions for lead operations (GET queries only)
 */

import { LeadsListResponseSchema } from "@/shared/validation/lead.schema";
import { CustomerResponseSchema } from "@/shared/validation/customer.schema";
import type { LeadResponse } from "@/shared/validation/lead.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { LEAD_ENDPOINTS } from "./constants";

export type GetLeadsDailyParams = {
  date?: string; // YYYY-MM-DD format
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Get leads list for daily view
 * GET /api/v1/leads/daily
 * @param params - Query parameters (date, search, page, pageSize)
 * @returns Paginated list of leads for the selected date
 */
export async function getLeadsDailyApi(params?: GetLeadsDailyParams) {
  const query = new URLSearchParams();
  if (params?.date) query.set("date", params.date);
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());

  const qs = query.toString();
  const url = qs ? `${LEAD_ENDPOINTS.DAILY}?${qs}` : LEAD_ENDPOINTS.DAILY;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = LeadsListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Danh sách lead không hợp lệ.");
  }

  return parsed.data;
}

/**
 * Get lead detail by ID
 * GET /api/v1/leads/[id]
 * @param id - Lead ID
 * @returns Lead detail
 */
export async function getLeadByIdApi(id: string): Promise<LeadResponse> {
  const res = await fetch(LEAD_ENDPOINTS.BY_ID(id), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = CustomerResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu lead không hợp lệ.");
  }

  return parsed.data;
}
