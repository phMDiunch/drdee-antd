// src/features/auth/api/login.ts
import { AUTH_ENDPOINTS } from "../constants";
import type { LoginRequest, LoginResponse, ApiError } from "../types";

export async function loginApi(payload: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // cookies phiên sẽ được set bởi API (SSR). Cùng origin nên không cần credentials.
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await res.json()) as LoginResponse | ApiError;

  if (!res.ok) {
    const message = (data as ApiError)?.error || "Đăng nhập thất bại.";
    throw new Error(message);
  }

  return data as LoginResponse;
}
