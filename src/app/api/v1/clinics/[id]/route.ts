// src/app/api/v1/clinics/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { clinicService } from "@/server/services/clinic.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const data = await clinicService.getById(user, params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const data = await clinicService.update(user, { ...body, id: params.id });
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const data = await clinicService.remove(user, params.id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
