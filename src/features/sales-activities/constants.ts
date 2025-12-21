// src/features/sales-activities/constants.ts

/**
 * API Endpoints
 */
export const SALES_ACTIVITY_ENDPOINTS = {
  ROOT: "/api/v1/sales-activities",
} as const;

/**
 * Query Keys for React Query
 */
export const SALES_ACTIVITY_QUERY_KEYS = {
  list: (params?: Record<string, unknown>) =>
    ["sales-activities", params] as const,
  byCustomer: (customerId: string) =>
    ["sales-activities", { customerId }] as const,
  byService: (consultedServiceId: string) =>
    ["sales-activities", { consultedServiceId }] as const,
} as const;

/**
 * Messages
 */
export const SALES_ACTIVITY_MESSAGES = {
  CREATE_SUCCESS: "Thêm hoạt động liên hệ thành công",
  UPDATE_SUCCESS: "Cập nhật hoạt động thành công",
  DELETE_SUCCESS: "Xóa hoạt động thành công",
  DELETE_CONFIRM_TITLE: "Xác nhận xóa",
  DELETE_CONFIRM_MESSAGE: "Bạn có chắc chắn muốn xóa hoạt động liên hệ này?",
  LOAD_ERROR: "Không thể tải danh sách hoạt động liên hệ",
} as const;

/**
 * Contact Type Labels
 */
export const CONTACT_TYPE_LABELS: Record<"call" | "message" | "meet", string> =
  {
    call: "Gọi điện",
    message: "Nhắn tin",
    meet: "Gặp mặt",
  } as const;

/**
 * Contact Type Icons (emoji)
 */
export const CONTACT_TYPE_ICONS: Record<"call" | "message" | "meet", string> = {
  call: "📞",
  message: "💬",
  meet: "👥",
} as const;
