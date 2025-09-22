// src/app/api/v1/employees/[id]/route.ts
import { NextResponse } from "next/server";
import { employeeService } from "@/server/services/employee.service";
import { pickUpdatePayload } from "@/server/validators/employee";

type Params = { params: { id: string } };

export async function GET(_: Request, { params }: Params) {
  const emp = await employeeService.getById(params.id);
  if (!emp)
    return NextResponse.json(
      { error: "Không tìm thấy nhân viên." },
      { status: 404 }
    );
  return NextResponse.json(emp);
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = pickUpdatePayload(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { error: parsed.errors.join(" ") },
        { status: 400 }
      );
    }
    const updated = await employeeService.update(params.id, parsed.data);
    return NextResponse.json({ id: updated.id });
  } catch {
    return NextResponse.json(
      { error: "Không thể cập nhật nhân viên." },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    await employeeService.remove(params.id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Không thể xoá nhân viên." },
      { status: 500 }
    );
  }
}
