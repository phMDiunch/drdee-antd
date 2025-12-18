// src/app/api/v1/sales-analytics/service-win-rate/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesAnalyticsService } from "@/server/services/sales-analytics.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-analytics/service-win-rate
 * Get service type win rate analysis
 * Query params: clinicId?, dateStart, dateEnd
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await salesAnalyticsService.getServiceWinRate(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("[GET /api/v1/sales-analytics/service-win-rate] Error:", e);
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
