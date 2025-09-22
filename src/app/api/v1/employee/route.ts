// src/app/api/v1/employees/route.ts
import { NextResponse } from "next/server";
import { employeeService } from "@/server/services/employee.service";
import { pickCreatePayload } from "@/server/validators/employee";

function toInt(val: string | null, def: number) {
  const n = Number(val ?? "");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = toInt(searchParams.get("page"), 1);
  const pageSize = toInt(searchParams.get("pageSize"), 20);
  const sortBy = (searchParams.get("sortBy") as any) ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as any) ?? "desc";

  const where = {
    q: searchParams.get("q") ?? undefined,
    role: searchParams.get("role") ?? undefined,
    employmentStatus: searchParams.get("employmentStatus") ?? undefined,
    clinicId: searchParams.get("clinicId") ?? undefined,
  };

  const data = await employeeService.list({ page, pageSize, sortBy, sortOrder, where });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = pickCreatePayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.errors.join(" ") }, { status: 400 });
    }

    const created = await employeeService.create(parsed.data);
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (e) {
    // có thể là unique violation (email/phone/employeeCode...)
    return NextResponse.json({ error: "Không thể tạo nhân viên." }, { status: 500 });
  }
}
