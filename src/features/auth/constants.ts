// src/features/auth/constants.ts

export const AUTH_ENDPOINTS = {
  LOGIN: "/api/v1/auth/login",
  LOGOUT: "/api/v1/auth/logout",
} as const;

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: "Đăng nhập thành công.",
  LOGOUT_SUCCESS: "Đã đăng xuất.",
  FORGOT_PASSWORD_SUCCESS:
    "Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.",
  RESET_PASSWORD_SUCCESS:
    "Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.",
  UNKNOWN_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại.",
} as const;

