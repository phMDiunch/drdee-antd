// src/app/api/v1/dental-services/[id]/unarchive/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { dentalServiceService } from "@/server/services/dental-service.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await dentalServiceService.unarchive(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
