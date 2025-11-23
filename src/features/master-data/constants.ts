// src/features/master-data/constants.ts

/**
 * React Query Keys
 */
export const MASTER_DATA_QUERY_KEYS = {
  list: () => ["master-data"] as const,
} as const;

/**
 * UI Messages
 */
export const MASTER_DATA_MESSAGES = {
  CREATE_SUCCESS: "Tạo dữ liệu chủ thành công.",
  UPDATE_SUCCESS: "Cập nhật dữ liệu chủ thành công.",
  DELETE_SUCCESS: "Xóa dữ liệu chủ thành công.",
} as const;
