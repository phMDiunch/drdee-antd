// src/app/api/v1/treatment-logs/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentLogService } from "@/server/services/treatment-log.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/treatment-logs - List treatment logs with filters
 * Query params: customerId?, appointmentId?
 * Used by: useTreatmentLogs hook
 * Validation: Handled by service layer
 * Cache: No cache (treatment log data changes frequently)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await treatmentLogService.list(user, query);

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

// POST removed - Use createTreatmentLogAction() Server Action instead
