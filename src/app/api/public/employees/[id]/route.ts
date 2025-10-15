// src/app/api/public/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * @description Lấy chi tiết một nhân viên cho việc hoàn thành hồ sơ (public access)
 * @method GET
 * @path /api/public/employees/:id
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    // Use public access method that doesn't require authentication
    const data = await employeeService.findByIdForProfileCompletion(id);
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
