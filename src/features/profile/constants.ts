// src/features/profile/constants.ts

export const PROFILE_ENDPOINTS = {
  ROOT: "/api/v1/profile",
} as const;

export const PROFILE_QUERY_KEYS = {
  current: ["profile", "current"] as const,
} as const;

export const PROFILE_MESSAGES = {
  UPDATE_SUCCESS: "Cập nhật thông tin thành công",
  UPDATE_ERROR: "Cập nhật thông tin thất bại",
  PASSWORD_CHANGE_SUCCESS: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
  PASSWORD_CHANGE_ERROR: "Đổi mật khẩu thất bại",
  LOAD_ERROR: "Không thể tải thông tin hồ sơ",
} as const;
