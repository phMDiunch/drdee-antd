// src/server/validators/auth.ts
export type LoginBody = { email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLoginBody(body: LoginBody) {
  const email = body?.email?.trim() ?? "";
  const password = body?.password ?? "";

  if (!email || !password) {
    return { ok: false, message: "Email và mật khẩu là bắt buộc." } as const;
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Định dạng email không hợp lệ." } as const;
  }
  return { ok: true, email, password } as const;
}
