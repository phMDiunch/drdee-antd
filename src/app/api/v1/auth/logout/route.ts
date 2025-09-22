// src/app/api/v1/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { LogoutResponseSchema } from "@/shared/validation/auth.schema";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const safe = LogoutResponseSchema.parse({ ok: true });
    return NextResponse.json(safe, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Không thể đăng xuất." }, { status: 500 });
  }
}
