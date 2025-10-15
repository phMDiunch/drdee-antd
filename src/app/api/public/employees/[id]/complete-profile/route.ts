// src/app/api/public/employees/[id]/complete-profile/route.ts
import { NextResponse } from "next/server";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = await params;

    // Use public access method that doesn't require authentication
    const data = await employeeService.completeProfilePublic({
      ...body,
      id,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    if (e && typeof e === "object" && "name" in e && e.name === "ZodError") {
      return NextResponse.json(
        { error: "Payload is not valid." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
