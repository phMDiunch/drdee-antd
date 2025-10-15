// src/app/api/v1/employees/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

type Params = { params: Promise<{ id: string }> };

/**
 * @description Cập nhật trạng thái làm việc của nhân viên
 * @method PUT
 * @path /api/v1/employees/:id/status
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const data = await employeeService.setStatus(user, id, body);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
