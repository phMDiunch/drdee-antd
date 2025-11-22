// src/features/master-data/constants.ts
export const MASTER_DATA_ENDPOINTS = {
  ROOT: "/api/v1/master-data",
  ROOTS: "/api/v1/master-data/roots",
  BY_ID: (id: string) => `/api/v1/master-data/${id}`,
} as const;

export const MASTER_DATA_MESSAGES = {
  CREATE_SUCCESS: "Tạo dữ liệu chủ thành công.",
  UPDATE_SUCCESS: "Cập nhật dữ liệu chủ thành công.",
  DELETE_SUCCESS: "Xóa dữ liệu chủ thành công.",
  ACTIVATE_SUCCESS: "Kích hoạt dữ liệu chủ thành công.",
  DEACTIVATE_SUCCESS: "Vô hiệu hóa dữ liệu chủ thành công.",
} as const;
