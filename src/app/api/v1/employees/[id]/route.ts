// src/app/api/v1/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
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
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

/**
 * @description Cập nhật thông tin nhân viên
 * @method PUT
 * @path /api/v1/employees/:id
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const data = await employeeService.update(user, id, body);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}

/**
 * @description Xóa một nhân viên
 * @method DELETE
 * @path /api/v1/employees/:id
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await getSessionUser();
    const { id } = await params;
    const data = await employeeService.remove(user, id);
    return NextResponse.json(data, { status: 200 });
  } catch (e: unknown) {
    if (e instanceof ServiceError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: e.httpStatus });
    }
    return NextResponse.json({ error: "Lỗi máy chủ." }, { status: 500 });
  }
}
