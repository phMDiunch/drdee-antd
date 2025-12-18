// src/app/api/v1/sales-pipeline/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { salesPipelineService } from "@/server/services/sales-pipeline.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/sales-pipeline - Get pipeline services for dashboard
 * Query params: month (YYYY-MM), clinicId? (admin only)
 * Used by: usePipelineServices hook
 * Validation: Handled by service layer
 * Cache: No cache (pipeline data changes frequently)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await salesPipelineService.listPipelineServices(user, query);

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

// POST removed - Use Server Actions instead (claimPipelineAction, reassignSaleAction)
