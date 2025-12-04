// src/app/api/v1/labo-orders/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { laboOrderService } from "@/server/services/labo-order.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/labo-orders/daily - Get daily labo orders (sent or returned)
 * Query params: date (YYYY-MM-DD), type ('sent' | 'returned'), clinicId (optional)
 * Used by: useLaboOrdersDaily() hook
 * Validation: Handled by service layer (GetDailyLaboOrdersQuerySchema)
 * Cache: No cache (transactional data - always fresh)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = {
      date: searchParams.get("date") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      clinicId: searchParams.get("clinicId") ?? undefined,
    };

    const data = await laboOrderService.getDailyLaboOrders(user, query);

    // 🚀 No caching for transactional data
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
