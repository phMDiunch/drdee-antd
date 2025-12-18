// src/features/consulted-services/constants.ts

/**
 * Service Statuses
 */
export const SERVICE_STATUSES = {
  UNCONFIRMED: "Chưa chốt",
  CONFIRMED: "Đã chốt",
} as const;

export const SERVICE_STATUS_TAGS = {
  [SERVICE_STATUSES.UNCONFIRMED]: { color: "orange", text: "Chưa chốt" },
  [SERVICE_STATUSES.CONFIRMED]: { color: "green", text: "Đã chốt" },
} as const;

/**
 * Treatment Statuses
 */
export const TREATMENT_STATUSES = {
  NOT_STARTED: "Chưa điều trị",
  IN_PROGRESS: "Đang điều trị",
  COMPLETED: "Hoàn thành",
} as const;

export const TREATMENT_STATUS_TAGS = {
  [TREATMENT_STATUSES.NOT_STARTED]: { color: "default", text: "Chưa điều trị" },
  [TREATMENT_STATUSES.IN_PROGRESS]: {
    color: "processing",
    text: "Đang điều trị",
  },
  [TREATMENT_STATUSES.COMPLETED]: { color: "success", text: "Hoàn thành" },
} as const;

/**
 * Treatment Status Options for Select component
 */
export const TREATMENT_STATUS_OPTIONS = [
  { label: "Chưa điều trị", value: TREATMENT_STATUSES.NOT_STARTED },
  { label: "Đang điều trị", value: TREATMENT_STATUSES.IN_PROGRESS },
  { label: "Hoàn thành", value: TREATMENT_STATUSES.COMPLETED },
] as const;

/**
 * Edit Permission Days (33 days from serviceConfirmDate)
 */
export const EDIT_PERMISSION_DAYS = 33;

/**
 * Messages
 */
export const CONSULTED_SERVICE_MESSAGES = {
  // Success messages
  CREATE_SUCCESS: "Thêm dịch vụ tư vấn thành công",
  UPDATE_SUCCESS: "Cập nhật dịch vụ tư vấn thành công",
  DELETE_SUCCESS: "Xóa dịch vụ tư vấn thành công",
  CONFIRM_SUCCESS: "Chốt dịch vụ thành công",

  // Error messages
  CREATE_ERROR: "Lỗi khi thêm dịch vụ tư vấn",
  UPDATE_ERROR: "Lỗi khi cập nhật dịch vụ tư vấn",
  DELETE_ERROR: "Lỗi khi xóa dịch vụ tư vấn",
  CONFIRM_ERROR: "Lỗi khi chốt dịch vụ",
  FETCH_ERROR: "Lỗi khi tải dịch vụ tư vấn",

  // Validation messages
  CHECKIN_REQUIRED: "Khách hàng chưa check-in hôm nay",
  ALREADY_CONFIRMED: "Dịch vụ đã được chốt trước đó",
  INVALID_PRICE: "Giá ưu đãi không hợp lệ",
  TOOTH_POSITIONS_REQUIRED: "Vui lòng chọn vị trí răng",

  // Permission messages
  PERMISSION_DENIED: "Không có quyền thực hiện thao tác này",
  CANNOT_DELETE_CONFIRMED: "Không thể xóa dịch vụ đã chốt",
  CANNOT_EDIT_AFTER_33_DAYS: "Không thể chỉnh sửa dịch vụ đã chốt quá 33 ngày",
  EMPLOYEE_LIMITED_EDIT: "Dịch vụ đã chốt - chỉ sửa nhân sự trong 33 ngày",

  // Confirm messages
  DELETE_CONFIRM_UNCONFIRMED: "Xác nhận xóa dịch vụ này?",
  DELETE_CONFIRM_CONFIRMED:
    "⚠️ Dịch vụ đã chốt! Xóa có thể ảnh hưởng dữ liệu. Chắc chắn?",
  CONFIRM_SERVICE: "Xác nhận chốt? Sau khi chốt, giá trị sẽ được cố định",
} as const;

/**
 * React Query Keys
 */
export const CONSULTED_SERVICE_QUERY_KEYS = {
  list: (filters?: Record<string, unknown>) =>
    ["consulted-services", filters] as const,
  daily: (params?: Record<string, unknown>) =>
    ["consulted-services-daily", params] as const,
  byId: (id: string) => ["consulted-service", id] as const,
  byCustomer: (customerId: string) =>
    ["consulted-services", "customer", customerId] as const,
} as const;

/**
 * API Endpoints
 */
export const CONSULTED_SERVICE_ENDPOINTS = {
  BASE: "/api/v1/consulted-services",
  DAILY: "/api/v1/consulted-services/daily",
  BY_ID: (id: string) => `/api/v1/consulted-services/${id}`,
} as const;
