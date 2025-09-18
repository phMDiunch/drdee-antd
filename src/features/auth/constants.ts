// src/features/auth/constants.ts

export const AUTH_ENDPOINTS = {
  LOGIN: "/api/v1/auth/login",
  LOGOUT: "/api/v1/auth/logout",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "Đăng nhập thành công.",
  LOGOUT_SUCCESS: "Đã đăng xuất.",
  UNKNOWN_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại.",
} as const;
