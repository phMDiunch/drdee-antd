// src/app/api/v1/auth/login/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { LoginRequestSchema, LoginResponseSchema } from "@/shared/validation/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = LoginRequestSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message?.toLowerCase().includes("invalid login")
        ? "Email hoặc mật khẩu không đúng."
        : "Không thể đăng nhập. Vui lòng thử lại.";
      return NextResponse.json({ error: msg }, { status: 401 });
    }

    const safe = LoginResponseSchema.parse({
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    });
    return NextResponse.json(safe, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Lỗi máy chủ. Vui lòng thử lại." }, { status: 500 });
  }
}
