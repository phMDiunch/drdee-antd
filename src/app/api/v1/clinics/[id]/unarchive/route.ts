// src/app/api/v1/clinics/[id]/unarchive/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { clinicService } from "@/server/services/clinic.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: { id: string } };

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const data = await clinicService.unarchive(user, params.id);
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
