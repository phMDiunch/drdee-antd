// src/features/auth/api/logout.ts
import { AUTH_ENDPOINTS } from "../constants";
import type { LogoutResponse, ApiError } from "../types";

export async function logoutApi(): Promise<LogoutResponse> {
  const res = await fetch(AUTH_ENDPOINTS.LOGOUT, {
    method: "POST",
    cache: "no-store",
  });

  const data = (await res.json()) as LogoutResponse | ApiError;

  if (!res.ok) {
    const message = (data as ApiError)?.error || "Đăng xuất thất bại.";
    throw new Error(message);
  }

  return data as LogoutResponse;
}
