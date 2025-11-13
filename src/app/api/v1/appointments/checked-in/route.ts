// src/app/api/v1/appointments/checked-in/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { treatmentLogService } from "@/server/services/treatment-log.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/appointments/checked-in - Get checked-in appointments with consulted services and treatment logs
 * Query params: customerId (required)
 * Used by: useCheckedInAppointments hook (Customer Detail Treatment Log Tab)
 * Validation: Handled by service layer
 * Cache: No cache (appointment and treatment log data changes frequently)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await treatmentLogService.getCheckedInAppointmentsForTreatment(
      user,
      query
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
