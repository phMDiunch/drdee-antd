// src/app/api/v1/sales-analytics/time-per-stage/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesAnalyticsService } from "@/server/services/sales-analytics.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-analytics/time-per-stage
 * Get average time spent in each stage
 * Query params: clinicId?, dateStart, dateEnd
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await salesAnalyticsService.getAvgTimePerStage(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("[GET /api/v1/sales-analytics/time-per-stage] Error:", e);
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
