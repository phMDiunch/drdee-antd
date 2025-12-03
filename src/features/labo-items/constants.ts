// src/features/labo-items/constants.ts

export const LABO_ITEM_ENDPOINTS = {
  ROOT: "/api/v1/labo-items",
  BY_ID: (id: string) => `/api/v1/labo-items/${id}`,
  // ARCHIVE, UNARCHIVE removed - Use archiveLaboItemAction(), unarchiveLaboItemAction() instead
} as const;

export const LABO_ITEM_QUERY_KEYS = {
  list: (includeArchived: boolean) =>
    ["labo-items", { includeArchived }] as const,
  byId: (id: string) => ["labo-item", id] as const,
} as const;

export const LABO_ITEM_MESSAGES = {
  CREATE_SUCCESS: "Tạo hàng labo thành công.",
  UPDATE_SUCCESS: "Cập nhật hàng labo thành công.",
  DELETE_SUCCESS: "Xoá hàng labo thành công.",
  ARCHIVE_SUCCESS: "Đã lưu trữ hàng labo.",
  UNARCHIVE_SUCCESS: "Đã khôi phục hàng labo.",
} as const;

// Temporary constants - Will be replaced by MasterData
export const LABO_SERVICE_GROUPS: readonly string[] = [
  "Hàm giả tháo lắp",
  "Răng sứ - Cầu răng",
  "Chỉnh nha",
  "Implant",
] as const;

export const LABO_UNITS: readonly string[] = [
  "Răng",
  "Hàm",
  "Đơn vị",
  "Bộ",
] as const;
