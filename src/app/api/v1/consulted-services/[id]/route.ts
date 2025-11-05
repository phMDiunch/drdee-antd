// src/app/api/v1/consulted-services/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { consultedServiceService } from "@/server/services/consulted-service.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

/**
 * GET /api/v1/consulted-services/:id - Get consulted service by ID
 * Used by: useConsultedService(id) hook
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    const { id } = params;

    const data = await consultedServiceService.getById(user, id);

    // Cache: 1 minute with 5 minute stale-while-revalidate
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
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
