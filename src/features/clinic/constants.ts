// src/features/clinic/constants.ts
export const CLINIC_ENDPOINTS = {
  ROOT: "/api/v1/clinics",
  BY_ID: (id: string) => `/api/v1/clinics/${id}`,
  ARCHIVE: (id: string) => `/api/v1/clinics/${id}/archive`,
  UNARCHIVE: (id: string) => `/api/v1/clinics/${id}/unarchive`,
} as const;

export const CLINIC_QUERY_KEYS = {
  list: (includeArchived?: boolean) =>
    ["clinics", { includeArchived: !!includeArchived }] as const,
  byId: (id: string) => ["clinic", id] as const,
} as const;

export const CLINIC_MESSAGES = {
  CREATE_SUCCESS: "Tạo phòng khám thành công.",
  UPDATE_SUCCESS: "Cập nhật phòng khám thành công.",
  DELETE_SUCCESS: "Xoá phòng khám thành công.",
  ARCHIVE_SUCCESS: "Đã lưu trữ phòng khám.",
  UNARCHIVE_SUCCESS: "Đã khôi phục phòng khám.",
  UNKNOWN_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",
} as const;
