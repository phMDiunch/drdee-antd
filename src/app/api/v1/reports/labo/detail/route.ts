import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { laboReportService } from "@/server/services/labo-report.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/reports/labo/detail
 * Query params: month (YYYY-MM), clinicId (optional), tab, key
 * Used by: useLaboReportDetail hook
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
      tab: (searchParams.get("tab") || "") as
        | "daily"
        | "supplier"
        | "doctor"
        | "service",
      key: searchParams.get("key") || "",
    };

    const data = await laboReportService.getDetail(user, query);

    return NextResponse.json(data, {
      status: 200,
    });
  } catch (e: unknown) {
    console.error("[API] GET /api/v1/reports/labo/detail error:", e);

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
