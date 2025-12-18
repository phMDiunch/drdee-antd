// src/app/api/v1/sales-activities/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesPipelineService } from "@/server/services/sales-pipeline.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-activities/[id] - Get activities for a consulted service
 * Params: id (consultedServiceId)
 * Used by: useSalesActivities hook
 * Validation: Handled by service layer
 * Cache: No cache (activity data changes frequently)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    const resolvedParams = await params;
    const consultedServiceId = resolvedParams.id;

    const data = await salesPipelineService.getActivitiesByService(
      user,
      consultedServiceId
    );

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

// POST removed - Use createSalesActivityAction() Server Action instead
