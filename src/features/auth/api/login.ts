// src/features/auth/api/login.ts
import { AUTH_ENDPOINTS } from "../constants";
import { LoginRequestSchema, LoginResponseSchema, ApiErrorSchema } from "@/shared/validation/auth.schema";
import type { LoginResponse } from "@/features/auth/types";

export async function loginApi(payload: { email: string; password: string }): Promise<LoginResponse> {
  // (optional) validate client trước khi gửi
  LoginRequestSchema.parse(payload);

  const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = await res.json();

  if (!res.ok) {
    const err = ApiErrorSchema.safeParse(json);
    throw new Error(err.success ? err.data.error : "Đăng nhập thất bại.");
  }

  const parsed = LoginResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi đăng nhập không hợp lệ.");
  return parsed.data;
}
