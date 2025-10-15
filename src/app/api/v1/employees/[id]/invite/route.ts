// src/app/api/v1/employees/[id]/invite/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await employeeService.resendInvite(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Payload is not valid." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
