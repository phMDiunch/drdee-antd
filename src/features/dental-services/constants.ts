// src/features/dental-services/constants.ts

export const DENTAL_SERVICE_ENDPOINTS = {
  ROOT: "/api/v1/dental-services",
  BY_ID: (id: string) => `/api/v1/dental-services/${id}`,
  // ARCHIVE, UNARCHIVE removed - Use archiveDentalServiceAction(), unarchiveDentalServiceAction() instead
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
  "Chụp x-quang",
  "Làm sạch răng và điều trị viêm lợi",
  "Tẩy trắng răng",
  "Tẩy đốm răng",
  "Hàn răng",
  "Điều trị tuỷ răng sữa",
  "Điều trị tuỷ răng vĩnh viễn",
  "Cắt lợi",
  "Nhổ răng thường",
  "Nhổ răng khôn",
  "Cắt phanh",
  "Răng sứ kim loại",
  "Răng toàn sứ",
  "Inlay / Onlay / Overlay",
  "Hàm tháo lắp",
  "Implant Hàn Quốc",
  "Implant Mỹ",
  "Implant Pháp",
  "Implant Thuỵ Sỹ",
  "Nâng xoang kín",
  "Nâng xoang hở",
  "Ghép mô mềm",
  "Ghép xương",
  "Hàm / Implant",
  "Răng / Implant",
  "Máng hướng dẫn",
  "Bệnh án",
  "Mắc cài kim loại thông minh",
  "Chỉnh nha máng trong",
  "Mắc cài kim loại thường",
  "Mắc cài mặt lưỡi",
  "Mắc cài sứ thông minh",
  "Mắc cài sứ thường",
  "Chỉnh nha cho Implant",
  "Hàm duy trì",
  "Khí cụ chỉnh nha",
] as const;

// Gợi ý bộ phận/phân khoa (có thể chỉnh sửa để phù hợp thực tế)
export const DENTAL_DEPARTMENTS: readonly string[] = [
  "Tổng quát",
  "Phẫu thuật lợi",
  "Răng sứ",
  "Implant",
  "Nha chu",
  "Chỉnh nha",
] as const;
