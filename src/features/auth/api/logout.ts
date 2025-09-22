// src/features/auth/api/logout.ts
import { AUTH_ENDPOINTS } from "../constants";
import { LogoutResponseSchema, ApiErrorSchema } from "@/shared/validation/auth.schema";
import type { LogoutResponse } from "@/features/auth/types";

export async function logoutApi(): Promise<LogoutResponse> {
  const res = await fetch(AUTH_ENDPOINTS.LOGOUT, { method: "POST", cache: "no-store" });
  const json = await res.json();

  if (!res.ok) {
    const err = ApiErrorSchema.safeParse(json);
    throw new Error(err.success ? err.data.error : "Đăng xuất thất bại.");
  }

  const parsed = LogoutResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Phản hồi đăng xuất không hợp lệ.");
  return parsed.data;
}
