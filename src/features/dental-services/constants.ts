// src/features/dental-services/constants.ts

export const DENTAL_SERVICE_ENDPOINTS = {
  ROOT: "/api/v1/dental-services",
  BY_ID: (id: string) => `/api/v1/dental-services/${id}`,
  ARCHIVE: (id: string) => `/api/v1/dental-services/${id}/archive`,
  UNARCHIVE: (id: string) => `/api/v1/dental-services/${id}/unarchive`,
} as const;

export const DENTAL_SERVICE_QUERY_KEYS = {
  list: (includeArchived: boolean) =>
    ["dental-services", { includeArchived }] as const,
  byId: (id: string) => ["dental-service", id] as const,
} as const;

export const DENTAL_SERVICE_MESSAGES = {
  CREATE_SUCCESS: "Tạo dịch vụ thành công.",
  UPDATE_SUCCESS: "Cập nhật dịch vụ thành công.",
  DELETE_SUCCESS: "Xoá dịch vụ thành công.",
  ARCHIVE_SUCCESS: "Đã lưu trữ dịch vụ.",
  UNARCHIVE_SUCCESS: "Đã khôi phục dịch vụ.",
} as const;

// Constants cho unit, serviceGroup, department (tạm thời)
export const DENTAL_UNITS = ["Răng", "Hàm", "Lần", "Buổi", "Khác"] as const;

// Gợi ý nhóm dịch vụ (có thể chỉnh sửa để phù hợp thực tế)
export const DENTAL_SERVICE_GROUPS: readonly string[] = [
  "Khám - Tư vấn",
  "Cạo vôi - Đánh bóng",
  "Trám răng",
  "Điều trị tủy",
  "Nha chu",
  "Răng sứ - Phục hình",
  "Tháo lắp",
  "Chỉnh nha",
  "Implant",
  "Tẩy trắng",
] as const;

// Gợi ý bộ phận/phân khoa (có thể chỉnh sửa để phù hợp thực tế)
export const DENTAL_DEPARTMENTS: readonly string[] = [
  "Nha tổng quát",
  "Chỉnh nha",
  "Nội nha",
  "Nha chu",
  "Phục hình",
  "Tiểu phẫu - Nhổ răng",
  "Implant",
  "Nha trẻ em",
] as const;
