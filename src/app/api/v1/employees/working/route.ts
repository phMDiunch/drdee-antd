// src/app/api/v1/employees/working/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/employees/working - List working employees (simplified)
 * Query params: none
 * Used by: useWorkingEmployees() hook
 * Validation: Handled by service layer
 * Cache: 5 minute (semi-master data)
 */
export async function GET() {
  try {
    const user = await getSessionUser();

    const data = await employeeService.listWorking(user);

    // 🚀 API Response Caching
    // Cache 5 phút, serve stale up to 10 phút while revalidating
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
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
