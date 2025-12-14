// src/features/leads/constants.ts

export const LEAD_ENDPOINTS = {
  DAILY: "/api/v1/leads/daily",
  BY_ID: (id: string) => `/api/v1/leads/${id}`,
} as const;

export const LEAD_QUERY_KEYS = {
  daily: (date?: string) => ["leads", "daily", { date }] as const,
  byId: (id: string) => ["lead", id] as const,
} as const;

export const LEAD_MESSAGES = {
  CREATE_SUCCESS: "Tạo lead thành công",
  UPDATE_SUCCESS: "Cập nhật lead thành công",
  DELETE_SUCCESS: "Xóa lead thành công",
  PHONE_ALREADY_EXISTS: "Số điện thoại đã tồn tại",
  CONVERT_SUCCESS: "Chuyển đổi lead thành khách hàng thành công",
} as const;

/**
 * Dịch vụ quan tâm - Services of Interest
 * Used for lead categorization and statistics
 */
export const SERVICES_OF_INTEREST = [
  { value: "nieng_rang", label: "Niềng răng" },
  { value: "implant", label: "Implant" },
  { value: "tong_quat", label: "Tổng quát" },
] as const;

export type ServiceOfInterestValue =
  (typeof SERVICES_OF_INTEREST)[number]["value"];
