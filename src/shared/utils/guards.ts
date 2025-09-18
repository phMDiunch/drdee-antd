// src/shared/utils/guards.ts

import type { LoginResponse, ApiError } from "@/features/auth/types";
import type { UserCore } from "@/shared/types/user";

export function isApiError(x: unknown): x is ApiError {
  return !!x && typeof x === "object" && "error" in (x as any) && typeof (x as any).error === "string";
}

export function isLoginResponse(x: unknown): x is LoginResponse {
  if (!x || typeof x !== "object" || !("user" in (x as any))) return false;
  const u = (x as any).user;
  if (u === null) return true;
  return typeof u.id === "string" && "email" in u;
}

export function isUserCore(x: unknown): x is UserCore {
  if (!x || typeof x !== "object") return false;
  const o = x as any;
  return typeof o.id === "string" && "email" in o;
}

// Helpers “ensure” – ném lỗi nếu sai shape (dùng trong nơi nhạy cảm)
export function ensureLoginResponse(x: unknown): LoginResponse {
  if (!isLoginResponse(x)) throw new Error("Phản hồi đăng nhập không hợp lệ.");
  return x;
}

export function ensureApiOk(ok: boolean, fallback = "Đã có lỗi xảy ra") {
  if (!ok) throw new Error(fallback);
}
