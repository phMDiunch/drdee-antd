// src/app/api/v1/customers/daily/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { customerService } from "@/server/services/customer.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/customers/daily - Daily customers report
 * Query params: date, clinicId
 * Used by: useCustomersDaily() hook
 * Validation: Handled by service layer
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await customerService.daily(user, query);

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
