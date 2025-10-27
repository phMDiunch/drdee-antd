// src/app/api/v1/customers/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { customerService } from "@/server/services/customer.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();

    const { searchParams } = new URL(req.url);
    const query = Object.fromEntries(searchParams);

    const data = await customerService.list(user, query);

    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("=== ERROR in GET /customers ===");
    console.error(
      "Error type:",
      e instanceof ServiceError ? "ServiceError" : typeof e
    );
    console.error("Error message:", e instanceof Error ? e.message : e);
    console.error(
      "Error stack:",
      e instanceof Error ? e.stack : "No stack trace"
    );

    if (e instanceof ServiceError) {
      console.error(
        "ServiceError details - Code:",
        e.code,
        "HTTP Status:",
        e.httpStatus
      );
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

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const data = await customerService.create(user, body);
    return NextResponse.json(data, { status: 201 });
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
