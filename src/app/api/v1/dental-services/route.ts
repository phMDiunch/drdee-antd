// src/app/api/v1/dental-services/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { dentalServiceService } from "@/server/services/dental-service.service";
import { GetDentalServicesQuerySchema } from "@/shared/validation/dental-service.schema";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());
    const parsed = GetDentalServicesQuerySchema.safeParse(queryObj);
    if (!parsed.success) {
      return NextResponse.json(
        { error: COMMON_MESSAGES.VALIDATION_INVALID },
        { status: 400 }
      );
    }
    const includeArchived = parsed.data.includeArchived === "1";
    const data = await dentalServiceService.list(user, includeArchived);

    // 🚀 Task 4: API Response Caching
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

// POST removed - Use createDentalServiceAction() Server Action instead
