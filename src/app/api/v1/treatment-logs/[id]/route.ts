// src/app/api/v1/treatment-logs/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentLogService } from "@/server/services/treatment-log.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/treatment-logs/:id - Get treatment log by ID
 * Used by: useTreatmentLog hook
 * Validation: Handled by service layer
 * Cache: No cache
 */
export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    const data = await treatmentLogService.getById(user, params.id);

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

// PUT removed - Use updateTreatmentLogAction() Server Action instead
// DELETE removed - Use deleteTreatmentLogAction() Server Action instead
