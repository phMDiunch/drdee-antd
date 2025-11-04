// src/app/api/v1/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * @description Lấy chi tiết một nhân viên
 * @method GET
 * @path /api/v1/employees/:id
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await employeeService.findById(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.httpStatus }
      );
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

// PUT removed - Use updateEmployeeAction() Server Action instead
// DELETE removed - Use deleteEmployeeAction() Server Action instead
