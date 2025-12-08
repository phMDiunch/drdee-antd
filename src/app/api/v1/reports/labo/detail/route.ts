import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { laboReportService } from "@/server/services/labo-report.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/reports/labo/detail - Get labo report detail records
 * Query params: month, clinicId, tab, key, page, pageSize
 * Used by: useLaboReportDetail()
 * Validation: Handled by service layer
 * Cache: No server cache (transactional data)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
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
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: parseInt(searchParams.get("pageSize") || "20", 10),
    };

    const data = await laboReportService.getDetail(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    console.error("[GET /api/v1/reports/labo/detail]", e);
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}
