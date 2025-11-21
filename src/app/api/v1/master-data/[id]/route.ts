// src/app/api/v1/master-data/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { masterDataService } from "@/server/services/master-data.service";
import { getSessionUser } from "@/server/services/auth.service";

/**
 * GET /api/v1/master-data/:id
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getSessionUser();
    const { id } = await context.params;
    const data = await masterDataService.getById(currentUser, id);

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
