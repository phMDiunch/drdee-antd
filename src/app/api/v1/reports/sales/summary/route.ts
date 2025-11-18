import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesReportService } from "@/server/services/sales-report.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/reports/sales/summary
 * Query params: month (YYYY-MM), clinicId (optional for admin)
 * Used by: useSalesSummary hook
 * Validation: Handled by service layer (Zod)
 * Cache: No cache (transactional data)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = {
      month: searchParams.get("month") || "",
      clinicId: searchParams.get("clinicId") || undefined,
    };

    const data = await salesReportService.getSummary(user, query);

    return NextResponse.json(data, {
      status: 200,
    });
  } catch (e: unknown) {
    console.error("[API] GET /api/v1/reports/sales/summary error:", e);

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
