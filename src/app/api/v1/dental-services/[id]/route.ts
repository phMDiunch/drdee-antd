// src/app/api/v1/dental-services/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { dentalServiceService } from "@/server/services/dental-service.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await dentalServiceService.getById(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: COMMON_MESSAGES.SERVER_ERROR }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const data = await dentalServiceService.update(user, { ...body, id });
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: COMMON_MESSAGES.SERVER_ERROR }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await dentalServiceService.remove(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: COMMON_MESSAGES.SERVER_ERROR }, { status: 500 });
  }
}
