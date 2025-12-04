// src/features/labo-services/constants.ts

export const LABO_SERVICE_ENDPOINTS = {
  ROOT: "/api/v1/labo-services",
  BY_ID: (id: string) => `/api/v1/labo-services/${id}`,
} as const;

export const LABO_SERVICE_QUERY_KEYS = {
  list: (params?: { sortBy?: string; sortOrder?: string; supplierId?: string }) =>
    ["labo-services", params] as const,
  byId: (id: string) => ["labo-service", id] as const,
} as const;

export const LABO_SERVICE_MESSAGES = {
  CREATE_SUCCESS: "Thêm dịch vụ labo thành công.",
  UPDATE_SUCCESS: "Cập nhật giá thành công.",
  DELETE_SUCCESS: "Xóa dịch vụ thành công.",
} as const;

// Temporary constants - Will be replaced by MasterData
export const LABO_WARRANTY_OPTIONS: readonly string[] = [
  "6-thang",
  "1-nam",
  "2-nam",
  "5-nam",
  "7-nam",
  "10-nam",
] as const;

export const LABO_WARRANTY_LABELS: Record<string, string> = {
  "6-thang": "6 tháng",
  "1-nam": "1 năm",
  "2-nam": "2 năm",
  "5-nam": "5 năm",
  "7-nam": "7 năm",
  "10-nam": "10 năm",
};
