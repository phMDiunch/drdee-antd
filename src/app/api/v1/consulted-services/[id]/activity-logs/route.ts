/**
 * GET /api/v1/consulted-services/:id/activity-logs - Get sales activity logs
 * Returns list of contact activities for a consulted service
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesActivityLogService } from "@/server/services/sales-activity-log.service";
import { ServiceError } from "@/server/services/errors";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Bạn chưa đăng nhập" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Get activity logs (service handles permissions)
    const result = await salesActivityLogService.listByConsultedServiceId(
      id,
      user
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.httpStatus }
      );
    }
    console.error("[GET /api/v1/consulted-services/:id/activity-logs]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
