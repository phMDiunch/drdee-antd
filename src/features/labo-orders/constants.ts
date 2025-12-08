// src/features/labo-orders/constants.ts

export const LABO_ORDER_ENDPOINTS = {
  DAILY: "/api/v1/labo-orders/daily",
  STATISTICS: "/api/v1/labo-orders/statistics",
} as const;

export const LABO_ORDER_QUERY_KEYS = {
  daily: (params: {
    date: string;
    type: "sent" | "returned";
    clinicId?: string;
  }) => ["labo-orders-daily", params] as const,
  statistics: (params: { date: string; clinicId?: string }) =>
    ["labo-orders-statistics", params] as const,
} as const;

export const LABO_ORDER_MESSAGES = {
  CREATE_SUCCESS: "Tạo đơn hàng labo thành công.",
  UPDATE_SUCCESS: "Cập nhật đơn hàng thành công.",
  DELETE_SUCCESS: "Xóa đơn hàng thành công.",
  RECEIVE_SUCCESS: "Đã xác nhận nhận mẫu.",
} as const;

/**
 * Labo Order Types
 * Loại đơn hàng: Làm mới (có phí) hoặc Bảo hành (miễn phí)
 */
export const LABO_ORDER_TYPE_OPTIONS = [
  { label: "Làm mới", value: "Làm mới" },
  { label: "Bảo hành", value: "Bảo hành" },
] as const;
