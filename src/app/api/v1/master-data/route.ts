// src/app/api/v1/master-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import { masterDataService } from "@/server/services/master-data.service";
import { getSessionUser } from "@/server/services/auth.service";
import { GetMasterDataQuerySchema } from "@/shared/validation/master-data.schema";

/**
 * GET /api/v1/master-data
 * Public to authenticated users
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();

    const searchParams = request.nextUrl.searchParams;
    const parsed = GetMasterDataQuerySchema.safeParse({
      type: searchParams.get("type") ?? undefined,
      includeInactive: searchParams.get("includeInactive") === "true",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Invalid query" },
        { status: 400 }
      );
    }

    const data = await masterDataService.list(
      currentUser,
      parsed.data.type,
      parsed.data.includeInactive
    );

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
