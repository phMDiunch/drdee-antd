// src/features/payments/constants.ts

import type { PaymentMethod } from "@/shared/validation/payment-voucher.schema";

/**
 * Payment methods configuration
 */
export const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "Tiền mặt", label: "Tiền mặt", icon: "💵", color: "green" },
  {
    value: "Quẹt thẻ thường",
    label: "Quẹt thẻ thường",
    icon: "💳",
    color: "blue",
  },
  {
    value: "Quẹt thẻ Visa",
    label: "Quẹt thẻ Visa",
    icon: "💎",
    color: "purple",
  },
  { value: "Chuyển khoản", label: "Chuyển khoản", icon: "🏦", color: "orange" },
];

/**
 * Payment method labels map for quick access
 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  "Tiền mặt": "Tiền mặt",
  "Quẹt thẻ thường": "Quẹt thẻ thường",
  "Quẹt thẻ Visa": "Quẹt thẻ Visa",
  "Chuyển khoản": "Chuyển khoản",
};

/**
 * Get payment method config by value
 */
export function getPaymentMethodConfig(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value) || PAYMENT_METHODS[0];
}

/**
 * Payment feature messages
 */
export const PAYMENT_MESSAGES = {
  // Success messages
  CREATE_SUCCESS: "Tạo phiếu thu thành công",
  UPDATE_SUCCESS: "Cập nhật phiếu thu thành công",
  DELETE_SUCCESS: "Xóa phiếu thu thành công",

  // Error messages
  CREATE_ERROR: "Không thể tạo phiếu thu. Vui lòng thử lại.",
  UPDATE_ERROR: "Không thể cập nhật phiếu thu. Vui lòng thử lại.",
  DELETE_ERROR: "Không thể xóa phiếu thu. Vui lòng thử lại.",
  LOAD_ERROR: "Không thể tải danh sách phiếu thu. Vui lòng thử lại.",
  DETAIL_ERROR: "Không thể tải chi tiết phiếu thu. Vui lòng thử lại.",
  UNPAID_ERROR: "Không thể tải danh sách dịch vụ còn nợ. Vui lòng thử lại.",

  // Validation messages
  NO_CUSTOMER: "Vui lòng chọn khách hàng",
  NO_SERVICES: "Vui lòng chọn ít nhất một dịch vụ để thu tiền",
  INVALID_AMOUNT: "Số tiền không hợp lệ",
  AMOUNT_EXCEEDS_DEBT: "Số tiền thu vượt quá công nợ",
  NO_UNPAID: "Khách hàng không có dịch vụ nào còn nợ",

  // Confirmation messages
  DELETE_CONFIRM_TITLE: "⚠️ Xác nhận xóa phiếu thu",
  DELETE_CONFIRM_MESSAGE:
    "Xóa phiếu thu sẽ hoàn lại tiền vào công nợ. Bạn chắc chắn muốn xóa?",

  // Info messages
  PAST_VOUCHER_WARNING: "Phiếu thu của ngày trước: Chỉ admin mới có thể sửa",
  TODAY_VOUCHER_INFO:
    "Nhân viên chỉ có thể sửa ghi chú và phương thức thanh toán",
};

/**
 * API endpoints
 */
export const PAYMENT_API_ENDPOINTS = {
  LIST: "/api/v1/payment-vouchers",
  DAILY: "/api/v1/payment-vouchers/daily",
  DETAIL: (id: string) => `/api/v1/payment-vouchers/${id}`,
  UNPAID: (customerId: string) =>
    `/api/v1/customers/${customerId}/unpaid-services`,
};
