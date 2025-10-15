// src/features/employees/constants.ts
export const EMPLOYEE_ENDPOINTS = {
  ROOT: "/api/v1/employees",
  BY_ID: (id: string) => `/api/v1/employees/${id}`,
  PUBLIC_BY_ID: (id: string) => `/api/public/employees/${id}`,
  WORKING: "/api/v1/employees/working",
  SET_STATUS: (id: string) => `/api/v1/employees/${id}/status`,
  INVITE: (id: string) => `/api/v1/employees/${id}/invite`,
  PUBLIC_COMPLETE_PROFILE: (id: string) =>
    `/api/public/employees/${id}/complete-profile`,
} as const;

export const EMPLOYEE_QUERY_KEYS = {
  list: (search?: string) => ["employees", { search }] as const,
  working: () => ["employees", "working"] as const,
  byId: (id: string) => ["employee", id] as const,
} as const;

export const EMPLOYEE_MESSAGES = {
  CREATE_SUCCESS: "Tạo nhân viên thành công.",
  UPDATE_SUCCESS: "Cập nhật nhân viên thành công.",
  DELETE_SUCCESS: "Xóa nhân viên thành công.",
  SET_STATUS_SUCCESS: "Cập nhật trạng thái nhân viên thành công.",
  INVITE_SUCCESS: "Đã gửi lại lời mời.",
  COMPLETE_PROFILE_SUCCESS: "Hoàn thiện hồ sơ thành công.",
  UNKNOWN_ERROR: "Đã có lỗi xảy ra. Vui lòng thử lại.",
} as const;
