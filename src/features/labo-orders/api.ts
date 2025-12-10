// src/features/labo-orders/api.ts
/**
 * Labo Order API Client
 * CHỈ chứa queries (GET) - Mutations dùng Server Actions
 */

import type {
  GetDailyLaboOrdersQuery,
  LaboOrdersDailyResponse,
} from "@/shared/validation/labo-order.schema";
import { LABO_ORDER_ENDPOINTS } from "./constants";

/**
 * Get daily labo orders (sent or returned on specific date)
 * GET /api/v1/labo-orders/daily
 */
export async function getDailyLaboOrdersApi(
  params: GetDailyLaboOrdersQuery
): Promise<LaboOrdersDailyResponse> {
  // Filter out undefined values to avoid sending "undefined" as string
  const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null) {
      acc[key] = String(value);
    }
    return acc;
  }, {} as Record<string, string>);

  const query = new URLSearchParams(filteredParams);
  const res = await fetch(`${LABO_ORDER_ENDPOINTS.DAILY}?${query.toString()}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error);
  }

  return res.json();
}
