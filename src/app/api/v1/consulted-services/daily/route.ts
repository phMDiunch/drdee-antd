// src/app/api/v1/consulted-services/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { consultedServiceService } from "@/server/services/consulted-service.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/consulted-services/daily - Daily consulted services report
 * Query params: date, clinicId
 * Used by: useConsultedServicesDaily() hook
 * Validation: Handled by service layer
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await consultedServiceService.listDaily(user, query);

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
