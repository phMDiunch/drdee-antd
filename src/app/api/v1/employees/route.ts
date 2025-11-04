// src/app/api/v1/employees/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";
import { GetEmployeesQuerySchema } from "@/shared/validation/employee.schema";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    const { searchParams } = new URL(req.url);
    const query = GetEmployeesQuerySchema.parse(
      Object.fromEntries(searchParams)
    );
    const data = await employeeService.list(user, query);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    if (
      typeof e === "object" &&
      e !== null &&
      "name" in e &&
      e.name === "ZodError"
    ) {
      return NextResponse.json(
        { error: COMMON_MESSAGES.VALIDATION_INVALID },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: COMMON_MESSAGES.SERVER_ERROR },
      { status: 500 }
    );
  }
}

// POST removed - Use createEmployeeAction() Server Action instead
