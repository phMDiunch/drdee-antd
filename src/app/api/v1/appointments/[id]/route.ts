// src/app/api/v1/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { appointmentService } from "@/server/services/appointment.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/v1/appointments/[id] - Get appointment detail
 * Used by: useAppointment(id) hook
 */
export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    const data = await appointmentService.getById(user, params.id);
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

// PUT removed - Use updateAppointmentAction() Server Action instead
// DELETE removed - Use deleteAppointmentAction() Server Action instead
