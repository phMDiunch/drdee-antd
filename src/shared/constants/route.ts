// src/shared/constants/routes.ts
export const DEFAULT_AFTER_LOGIN = "/dashboard";
export const ALLOWED_NEXT_PREFIXES = ["/"]; // chỉ cho phép điều hướng nội bộ

export function sanitizeNext(next?: string | null) {
  if (!next) return DEFAULT_AFTER_LOGIN;
  // chỉ cho phép đường dẫn bắt đầu bằng "/" để tránh open redirect
  return ALLOWED_NEXT_PREFIXES.some((p) => next.startsWith(p)) ? next : DEFAULT_AFTER_LOGIN;
}
