// src/features/sales-pipeline/constants.ts
import { FunnelPlotOutlined } from "@ant-design/icons";

/**
 * Query keys for sales pipeline
 */
export const SALES_PIPELINE_QUERY_KEYS = {
  list: (params?: { month?: string; clinicId?: string }) =>
    ["sales-pipeline", params] as const,
  activities: (consultedServiceId: string) =>
    ["sales-activities", consultedServiceId] as const,
} as const;

/**
 * Menu configuration
 */
export const SALES_PIPELINE_MENU = {
  key: "sales-pipeline",
  icon: FunnelPlotOutlined,
  label: "Sales Pipeline",
  path: "/sales-pipeline",
};

/**
 * Messages
 */
export const SALES_PIPELINE_MESSAGES = {
  // Success messages
  CLAIM_SUCCESS: "Đã nhận quản lý dịch vụ thành công",
  REASSIGN_SUCCESS: "Đã chuyển sale thành công",
  ACTIVITY_CREATE_SUCCESS: "Đã ghi nhận hoạt động tiếp xúc",

  // Error messages
  CLAIM_ERROR: "Không thể nhận quản lý dịch vụ",
  REASSIGN_ERROR: "Không thể chuyển sale",
  ACTIVITY_CREATE_ERROR: "Không thể ghi nhận hoạt động",
  LOAD_SERVICES_ERROR: "Không thể tải danh sách dịch vụ",
  LOAD_ACTIVITIES_ERROR: "Không thể tải lịch sử tiếp xúc",
} as const;

/**
 * Pipeline Stages - Offline (Current)
 */
export const OFFLINE_STAGES = [
  { key: "ARRIVED", title: "Đã đến", color: "purple" },
  { key: "CONSULTING", title: "Đang tư vấn", color: "orange" },
  { key: "QUOTED", title: "Đã báo giá", color: "gold" },
  { key: "DEPOSIT", title: "Đã cọc", color: "green" },
  { key: "TREATING", title: "Đã làm", color: "lime" },
  { key: "LOST", title: "Thất bại", color: "red" },
] as const;

/**
 * Pipeline Stages - Online (Future)
 */
export const ONLINE_STAGES = [
  { key: "NEW", title: "Mới", color: "blue" },
  { key: "CONTACTING", title: "Đang liên hệ", color: "cyan" },
  { key: "SCHEDULED", title: "Đã đặt lịch", color: "geekblue" },
  { key: "ARRIVED", title: "Đã đến ✅", color: "purple" },
  { key: "LOST", title: "Thất bại", color: "red" },
] as const;

/**
 * Contact type labels and icons
 */
export const CONTACT_TYPE_CONFIG = {
  call: { label: "Gọi điện", icon: "📞", color: "blue" },
  message: { label: "Nhắn tin", icon: "💬", color: "green" },
  meet: { label: "Gặp mặt", icon: "🤝", color: "orange" },
} as const;

/**
 * Contact type options for form
 */
export const CONTACT_TYPE_OPTIONS = [
  { value: "call", label: "Gọi điện" },
  { value: "message", label: "Nhắn tin" },
  { value: "meet", label: "Gặp mặt" },
];

/**
 * Placeholder text for content field by contact type
 */
export const CONTACT_CONTENT_PLACEHOLDERS = {
  call: "Ví dụ: Tư vấn về quy trình niềng răng, giá cả, thời gian điều trị...",
  message: "Ví dụ: Gửi báo giá qua Zalo, gửi hình ảnh kết quả điều trị mẫu...",
  meet: "Ví dụ: Khách đến phòng khám, trao đổi chi tiết về phương án điều trị...",
} as const;
