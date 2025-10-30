// src/features/appointments/constants.ts

export const APPOINTMENT_ENDPOINTS = {
  ROOT: "/api/v1/appointments",
  BY_ID: (id: string) => `/api/v1/appointments/${id}`,
  DAILY: "/api/v1/appointments/daily",
  CHECK_AVAILABILITY: "/api/v1/appointments/check-availability",
} as const;

export const APPOINTMENT_QUERY_KEYS = {
  list: (filters?: Record<string, unknown>) =>
    ["appointments", filters] as const,
  daily: (date?: string, clinicId?: string) =>
    ["appointments", "daily", { date, clinicId }] as const,
  byId: (id: string) => ["appointment", id] as const,
  checkAvailability: (params?: Record<string, unknown>) =>
    ["appointments", "check-availability", params] as const,
} as const;

export const APPOINTMENT_MESSAGES = {
  CREATE_SUCCESS: "Tạo lịch hẹn thành công",
  UPDATE_SUCCESS: "Cập nhật lịch hẹn thành công",
  DELETE_SUCCESS: "Xóa lịch hẹn thành công",
  CHECKIN_SUCCESS: "Check-in thành công",
  CHECKOUT_SUCCESS: "Check-out thành công",
  CONFIRM_SUCCESS: "Xác nhận lịch hẹn thành công",
  MARK_NO_SHOW_SUCCESS: "Đánh dấu không đến thành công",
  CUSTOMER_CONFLICT: "Khách hàng đã có lịch hẹn vào ngày này",
  PAST_APPOINTMENT_NOT_ALLOWED: "Không thể tạo lịch hẹn trong quá khứ",
} as const;

/**
 * Appointment Status Options
 * For Select/Radio components
 */
export const APPOINTMENT_STATUS_OPTIONS = [
  { label: "Chờ xác nhận", value: "Chờ xác nhận" },
  { label: "Đã xác nhận", value: "Đã xác nhận" },
  { label: "Đã đến", value: "Đã đến" },
  { label: "Đến đột xuất", value: "Đến đột xuất" },
  { label: "Không đến", value: "Không đến" },
  { label: "Đã hủy", value: "Đã hủy" },
] as const;

/**
 * Status Tag Colors
 * For Ant Design Tag component
 */
export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  "Chờ xác nhận": "default",
  "Đã xác nhận": "blue",
  "Đã đến": "green",
  "Đến đột xuất": "cyan",
  "Không đến": "red",
  "Đã hủy": "grey",
} as const;
