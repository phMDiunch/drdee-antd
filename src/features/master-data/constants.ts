// src/features/master-data/constants.ts
import { MASTER_DATA_TYPES } from "@/shared/constants/master-data";

export const MASTER_DATA_ENDPOINTS = {
  ROOT: "/api/v1/master-data",
  BY_ID: (id: string) => `/api/v1/master-data/${id}`,
} as const;

export const MASTER_DATA_QUERY_KEYS = {
  all: ["master-data"] as const,
  lists: () => [...MASTER_DATA_QUERY_KEYS.all, "list"] as const,
  list: (type?: string, includeInactive?: boolean) =>
    [
      ...MASTER_DATA_QUERY_KEYS.lists(),
      { type, includeInactive: !!includeInactive },
    ] as const,
  details: () => [...MASTER_DATA_QUERY_KEYS.all, "detail"] as const,
  detail: (id: string) => [...MASTER_DATA_QUERY_KEYS.details(), id] as const,
} as const;

export const MASTER_DATA_MESSAGES = {
  CREATE_SUCCESS: "Tạo dữ liệu chủ thành công.",
  UPDATE_SUCCESS: "Cập nhật dữ liệu chủ thành công.",
  DELETE_SUCCESS: "Xóa dữ liệu chủ thành công.",
} as const;

/**
 * Display names for master data types (Vietnamese)
 */
export const MASTER_DATA_TYPE_LABELS: Record<string, string> = {
  [MASTER_DATA_TYPES.SUPPLIER_GROUP]: "Nhóm nhà cung cấp",
  [MASTER_DATA_TYPES.DEPARTMENT]: "Phòng ban",
  [MASTER_DATA_TYPES.MATERIAL_CATEGORY]: "Danh mục vật tư",
  [MASTER_DATA_TYPES.UNIT]: "Đơn vị tính",
};

/**
 * Options for master data type select
 */
export const MASTER_DATA_TYPE_OPTIONS = Object.entries(
  MASTER_DATA_TYPE_LABELS
).map(([value, label]) => ({
  label,
  value,
}));
