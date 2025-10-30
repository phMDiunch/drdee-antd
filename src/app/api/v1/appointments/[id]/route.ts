// src/app/api/v1/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { appointmentService } from "@/server/services/appointment.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    const data = await appointmentService.getById(user, params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("=== ERROR in GET /appointments/[id] ===");
    console.error("Error message:", e instanceof Error ? e.message : e);

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

export async function PUT(req: Request, props: Params) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const data = await appointmentService.update(user, params.id, body);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("=== ERROR in PUT /appointments/[id] ===");
    console.error("Error message:", e instanceof Error ? e.message : e);

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

export async function DELETE(_req: Request, props: Params) {
  try {
    const params = await props.params;
    const user = await getSessionUser();
    const data = await appointmentService.delete(user, params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    console.error("=== ERROR in DELETE /appointments/[id] ===");
    console.error("Error message:", e instanceof Error ? e.message : e);

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
