/**
 * GET /api/v1/consulted-services/:id/stage-history - Get stage transition history
 * Returns list of stage changes for analytics and audit trail
 */
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { stageHistoryRepo } from "@/server/repos/stage-history.repo";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
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

    // Verify consulted service exists and user has access
    const service = await consultedServiceRepo.findById(id);
    if (!service) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Không tìm thấy dịch vụ tư vấn" },
        { status: 404 }
      );
    }

    // Permission check
    if (user.role !== "admin") {
      if (service.clinicId !== user.clinicId) {
        return NextResponse.json(
          {
            error: "PERMISSION_DENIED",
            message: "Bạn chỉ có thể xem lịch sử trong chi nhánh của mình",
          },
          { status: 403 }
        );
      }
    }

    // Get stage history
    const history = await stageHistoryRepo.listByConsultedServiceId(id);

    const mappedHistory = history.map((h) => ({
      id: h.id,
      consultedServiceId: h.consultedServiceId,
      fromStage: h.fromStage,
      toStage: h.toStage,
      reason: h.reason,
      changedAt: h.changedAt.toISOString(),
      changedBy: {
        id: h.changedBy.id,
        fullName: h.changedBy.fullName,
        avatarUrl: h.changedBy.avatarUrl,
      },
    }));

    return NextResponse.json({
      items: mappedHistory,
      count: mappedHistory.length,
    });
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.code, message: error.message },
        { status: error.httpStatus }
      );
    }
    console.error("[GET /api/v1/consulted-services/:id/stage-history]", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Có lỗi xảy ra" },
      { status: 500 }
    );
  }
}
