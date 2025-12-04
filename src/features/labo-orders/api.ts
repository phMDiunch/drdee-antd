// src/features/labo-orders/api.ts
/**
 * Labo Order API Client
 * Consolidated API functions for labo order operations
 */

import { DailyLaboOrderResponseSchema } from "@/shared/validation/labo-order.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";
import { LABO_ORDER_ENDPOINTS } from "./constants";
import { z } from "zod";

/**
 * Get daily labo orders (sent or returned on specific date)
 * GET /api/v1/labo-orders/daily
 * @param params - Query parameters (date, type, clinicId)
 * @returns { items, total }
 */
export async function getDailyLaboOrdersApi(params: {
  date: string; // YYYY-MM-DD
  type: "sent" | "returned";
  clinicId?: string;
}) {
  const query = new URLSearchParams();
  query.set("date", params.date);
  query.set("type", params.type);
  if (params.clinicId) query.set("clinicId", params.clinicId);

  const url = `${LABO_ORDER_ENDPOINTS.DAILY}?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || COMMON_MESSAGES.UNKNOWN_ERROR);

  // Validate response shape: { items: [], total: number }
  const responseSchema = z.object({
    items: z.array(DailyLaboOrderResponseSchema),
    total: z.number(),
  });

  const parsed = responseSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Phản hồi danh sách đơn hàng không hợp lệ.");
  }

  return parsed.data;
}
