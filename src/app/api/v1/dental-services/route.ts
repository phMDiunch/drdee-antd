// src/app/api/v1/dental-services/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { dentalServiceService } from "@/server/services/dental-service.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/dental-services - List dental services with filters
 * Query params: includeArchived
 * Used by: useDentalServices() hook
 * Validation: Handled by service layer
 * Cache: 5 minutes (master data)
 */
export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    // Parse includeArchived from query params
    const includeArchived = query.includeArchived === "1";

    const data = await dentalServiceService.list(user, includeArchived);

    // 🚀 API Response Caching - Master data cache 5 minutes
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

// POST removed - Use createDentalServiceAction() Server Action instead
