// src/app/api/v1/sales-activities/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesActivityService } from "@/server/services/sales-activity.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-activities/daily - Daily sales activities with statistics
 * Query params:
 *   - date (YYYY-MM-DD, required)
 *   - clinicId (UUID, optional)
 *
 * Used by: useDailySalesActivities() hook
 *
 * Returns: { items: SalesActivityResponse[], statistics: { totalActivities, totalCustomers, totalServices, contactTypeDistribution } }
 *
 * Permission Rules:
 * - Admin: Can choose any clinic or view all (if clinicId not provided)
 * - Employee with jobTitle "Chuyên viên sale online": Can choose any clinic or view all
 * - Regular Employee: Can only view their own clinic
 *
 * Cache: No cache (sales activity data changes frequently during the day)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const clinicId = searchParams.get("clinicId");

    const data = await salesActivityService.listDaily(user, {
      date: date || "",
      clinicId: clinicId || undefined,
    });

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
