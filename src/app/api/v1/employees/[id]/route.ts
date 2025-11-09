// src/app/api/v1/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";
import { COMMON_MESSAGES } from "@/shared/constants/messages";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, props: Params) {
  try {
    const params = await props.params;

    const user = await getSessionUser();

    const data = await employeeService.findById(user, params.id);

    return NextResponse.json(data, { status: 200 });
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

// PUT removed - Use updateEmployeeAction() Server Action instead
// DELETE removed - Use deleteEmployeeAction() Server Action instead
