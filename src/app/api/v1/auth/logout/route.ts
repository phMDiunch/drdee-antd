// src/app/api/v1/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Không thể đăng xuất. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
