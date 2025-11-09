// src/app/api/v1/appointments/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { appointmentService } from "@/server/services/appointment.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/appointments/daily - Daily appointments report
 * Query params: date, clinicId
 * Used by: useAppointmentsDaily() hook
 * Validation: Handled by service layer
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await appointmentService.listDaily(user, query);

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
