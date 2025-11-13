// src/app/api/v1/treatment-logs/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentLogService } from "@/server/services/treatment-log.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/treatment-logs/daily - Daily treatment logs with statistics
 * Query params: date (YYYY-MM-DD), clinicId (UUID)
 * Used by: useDailyTreatmentLogs() hook
 * Returns: { items: TreatmentLogResponse[], statistics: { totalCheckedInCustomers, totalTreatedCustomers, totalTreatmentLogs, treatmentRate } }
 * Permission: Employee (auto-filter by clinicId), Admin (use provided clinicId)
 * Cache: No cache (treatment data changes frequently during the day)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await treatmentLogService.listDaily(user, query);

    return NextResponse.json(data, { status: 200 });
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
