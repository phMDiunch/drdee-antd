// src/app/api/v1/master-data/roots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { masterDataService } from "@/server/services/master-data.service";
import { getSessionUser } from "@/server/utils/sessionCache";

/**
 * GET /api/v1/master-data/roots
 * Query params: includeInactive (optional)
 * Used by: useMasterDataRoots hook
 * Cache: 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get("includeInactive") === "true";

    const data = await masterDataService.getRoots(currentUser, includeInactive);

    // Cache for 5 minutes (master data changes infrequently)
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    const errorStatus = (error as { status?: number }).status ?? 500;
    return NextResponse.json(
      { message: errorMessage },
      { status: errorStatus }
    );
  }
}
