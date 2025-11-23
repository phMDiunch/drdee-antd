// src/features/suppliers/constants.ts

export const SUPPLIER_ENDPOINTS = {
  ROOT: "/api/v1/suppliers",
  BY_ID: (id: string) => `/api/v1/suppliers/${id}`,
} as const;

export const SUPPLIER_QUERY_KEYS = {
  list: (includeArchived: boolean) =>
    ["suppliers", { includeArchived }] as const,
  byId: (id: string) => ["supplier", id] as const,
} as const;

export const SUPPLIER_MESSAGES = {
  CREATE_SUCCESS: "Tạo nhà cung cấp thành công.",
  UPDATE_SUCCESS: "Cập nhật nhà cung cấp thành công.",
  DELETE_SUCCESS: "Xoá nhà cung cấp thành công.",
  ARCHIVE_SUCCESS: "Đã lưu trữ nhà cung cấp.",
  UNARCHIVE_SUCCESS: "Đã khôi phục nhà cung cấp.",
} as const;
