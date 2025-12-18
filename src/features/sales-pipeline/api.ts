// src/features/sales-pipeline/api.ts
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import {
  SalesActivitiesListResponseSchema,
  type GetSalesPipelineQuery,
} from "@/shared/validation/sales-activity.schema";

/**
 * Get pipeline services for dashboard (month view)
 */
export async function getPipelineServicesApi(params: GetSalesPipelineQuery) {
  const queryParams: Record<string, string> = {
    month: params.month,
  };

  if (params.clinicId) {
    queryParams.clinicId = params.clinicId;
  }

  const query = new URLSearchParams(queryParams);
  const res = await fetch(`/api/v1/sales-pipeline?${query}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  // Response validation will be handled by the hook
  return json;
}

/**
 * Get sales activities for a consulted service
 */
export async function getSalesActivitiesApi(consultedServiceId: string) {
  const res = await fetch(`/api/v1/sales-activities/${consultedServiceId}`);
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);
  }

  const parsed = SalesActivitiesListResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Dữ liệu lịch sử tiếp xúc không hợp lệ");
  }

  return parsed.data;
}
