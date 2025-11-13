// src/features/treatment-logs/constants.ts

export const TREATMENT_LOG_MESSAGES = {
  CREATE_SUCCESS: "Tạo lịch sử điều trị thành công",
  UPDATE_SUCCESS: "Cập nhật lịch sử điều trị thành công",
  DELETE_SUCCESS: "Xóa lịch sử điều trị thành công",
  DELETE_CONFIRM: "Xác nhận xoá lịch sử điều trị này?",
  SERVICE_NOT_CONFIRMED: "Dịch vụ chưa được chốt",
  APPOINTMENT_NOT_CHECKED_IN: "Buổi hẹn chưa check-in",
  PERMISSION_DENIED_EDIT:
    "Bạn chỉ có thể chỉnh sửa lịch sử điều trị do chính mình tạo",
  PERMISSION_DENIED_DELETE:
    "Bạn chỉ có thể xóa lịch sử điều trị do chính mình tạo",
  NO_TREATMENT_LOGS: "Chưa có lịch sử điều trị cho dịch vụ này",
  NO_CHECKED_IN_APPOINTMENTS: "Chưa có buổi hẹn nào đã check-in",
} as const;

/**
 * Query keys for React Query
 */
export const TREATMENT_LOG_QUERY_KEYS = {
  checkedInAppointments: (customerId: string) => [
    "appointments",
    "checked-in",
    customerId,
  ],
  treatmentLogs: (params?: { customerId?: string; appointmentId?: string }) => [
    "treatment-logs",
    params,
  ],
  treatmentLog: (id: string) => ["treatment-logs", "detail", id],
} as const;

/**
 * API endpoints
 */
export const TREATMENT_LOG_ENDPOINTS = {
  checkedInAppointments: "/api/v1/appointments/checked-in",
  treatmentLogs: "/api/v1/treatment-logs",
  treatmentLogDetail: (id: string) => `/api/v1/treatment-logs/${id}`,
} as const;
