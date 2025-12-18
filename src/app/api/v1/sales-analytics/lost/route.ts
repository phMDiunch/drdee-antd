// src/app/api/v1/sales-analytics/lost/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesAnalyticsService } from "@/server/services/sales-analytics.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-analytics/lost
 * Get lost customers analysis
 * Query params: clinicId?, dateStart, dateEnd
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await salesAnalyticsService.getLostAnalysis(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("[GET /api/v1/sales-analytics/lost] Error:", e);
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
