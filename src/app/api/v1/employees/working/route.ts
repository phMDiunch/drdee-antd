// src/app/api/v1/employees/working/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/server/services/auth.service";
import { employeeService } from "@/server/services/employee.service";
import { ServiceError } from "@/server/services/errors";

export const runtime = "nodejs";

/**
 * @description Lấy danh sách nhân viên đang làm việc (dạng rút gọn)
 * @method GET
 * @path /api/v1/employees/working
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    const data = await employeeService.listWorking(user);

    // 🚀 Task 4: API Response Caching
    // Cache 1 phút, serve stale up to 5 phút while revalidating
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
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
