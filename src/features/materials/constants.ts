// src/features/materials/constants.ts

export const MATERIAL_ENDPOINTS = {
  ROOT: "/api/v1/materials",
  BY_ID: (id: string) => `/api/v1/materials/${id}`,
} as const;

export const MATERIAL_QUERY_KEYS = {
  list: (includeArchived?: boolean) =>
    ["materials", { includeArchived }] as const,
  byId: (id: string) => ["material", id] as const,
} as const;

export const MATERIAL_MESSAGES = {
  CREATE_SUCCESS: "Tạo vật tư thành công.",
  UPDATE_SUCCESS: "Cập nhật vật tư thành công.",
  DELETE_SUCCESS: "Xoá vật tư thành công.",
  ARCHIVE_SUCCESS: "Đã lưu trữ vật tư.",
  UNARCHIVE_SUCCESS: "Đã khôi phục vật tư.",
} as const;

// MasterData categories for materials
export const MATERIAL_MASTER_DATA_CATEGORIES = {
  UNIT: "don-vi-tinh",
  TYPE: "loai-vat-tu",
  DEPARTMENT: "bo-mon",
  CATEGORY: "nhom-vat-tu",
  SUB_CATEGORY: "phan-nhom-vat-tu",
  TAGS: "tag-vat-tu",
} as const;
