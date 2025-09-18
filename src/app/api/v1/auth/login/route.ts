// // src/app/api/v1/auth/login/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";

import { validateLoginBody } from "@/server/validators/auth";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    // const body = (await req.json()) as LoginBody;

    // const email = body.email?.trim() ?? "";
    // const password = body.password ?? "";

    // if (!email || !password) {
    //   return NextResponse.json(
    //     { error: "Email và mật khẩu là bắt buộc." },
    //     { status: 400 }
    //   );
    // }

    const parsed = validateLoginBody((await req.json()) as LoginBody);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.message }, { status: 400 });
    }

    const { email, password } = parsed;

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Supabase có thể trả 400/401; frontend chỉ cần message là đủ
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // data.user sẽ có id, email...
    const user = data.user ? { id: data.user.id, email: data.user.email } : null;

    return NextResponse.json({ user }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: "Không thể đăng nhập. Vui lòng thử lại." }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { createClient } from "@/services/supabase/server";

// type LoginBody = {
//   email: string;
//   password: string;
// };

// // Thêm type cho response
// type LoginResponse = {
//   user?: {
//     id: string;
//     email: string;
//   };
//   error?: string;
// };

// export async function POST(req: Request): Promise<NextResponse<LoginResponse>> {
//   try {
//     const body = (await req.json()) as LoginBody;

//     const email = body.email?.trim() ?? "";
//     const password = body.password ?? "";

//     // Validation cải thiện
//     if (!email || !password) {
//       return NextResponse.json(
//         { error: "Email và mật khẩu là bắt buộc" },
//         { status: 400 }
//       );
//     }

//     // Validation email format
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(email)) {
//       return NextResponse.json(
//         { error: "Email không hợp lệ" },
//         { status: 400 }
//       );
//     }

//     const supabase = await createClient();
//     const { data, error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     });

//     if (error) {
//       // Log error để debug (không expose sensitive info)
//       console.error("Login error:", error.message);

//       // Trả về message generic hơn để bảo mật
//       return NextResponse.json(
//         { error: "Email hoặc mật khẩu không chính xác" },
//         { status: 401 }
//       );
//     }

//     if (!data.user) {
//       return NextResponse.json(
//         { error: "Đăng nhập thất bại" },
//         { status: 401 }
//       );
//     }

//     const user = {
//       id: data.user.id,
//       email: data.user.email || email,
//     };

//     return NextResponse.json({ user }, { status: 200 });
//   } catch (err: any) {
//     console.error("Login API error:", err);
//     return NextResponse.json(
//       { error: "Lỗi server. Vui lòng thử lại sau" },
//       { status: 500 }
//     );
//   }
// }
