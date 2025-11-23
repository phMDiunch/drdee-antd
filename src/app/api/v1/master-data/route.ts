// src/app/api/v1/master-data/route.ts
import { NextResponse } from "next/server";
import { masterDataService } from "@/server/services/master-data.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

/**
 * GET /api/v1/master-data - List ALL master data
 * No query params - always return everything
 * Client will filter as needed
 * Cache: 5 minutes (master data)
 */
export async function GET() {
  try {
    const data = await masterDataService.list();

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

// POST removed - Use createMasterDataAction() Server Action instead
