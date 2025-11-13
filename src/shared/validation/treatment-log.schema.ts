// src/shared/validation/treatment-log.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Treatment Status - SINGLE SOURCE OF TRUTH
 * Used by both TreatmentLog and ConsultedService
 *
 * ConsultedService.treatmentStatus: Auto-computed aggregate từ TreatmentLogs
 * TreatmentLog.treatmentStatus: User-editable per log entry
 */
export const TREATMENT_STATUSES = [
  "Chưa điều trị",
  "Đang điều trị",
  "Hoàn thành",
] as const;

export type TreatmentStatus = (typeof TREATMENT_STATUSES)[number];

/**
 * Treatment Log Common Fields Schema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 * Dùng để tái sử dụng cho cả Create và Update
 */
const TreatmentLogCommonFieldsSchema = z.object({
  consultedServiceId: z
    .string({ message: "Vui lòng chọn dịch vụ điều trị" })
    .uuid("ID dịch vụ không hợp lệ"),
  appointmentId: z
    .string({ message: "Vui lòng chọn buổi hẹn" })
    .uuid("ID buổi hẹn không hợp lệ"),
  treatmentNotes: z
    .string({ message: "Vui lòng nhập nội dung điều trị" })
    .min(1, "Nội dung điều trị không được để trống"),
  nextStepNotes: z.string().trim().optional().nullable(),
  treatmentStatus: z.enum(TREATMENT_STATUSES, {
    message: "Trạng thái điều trị không hợp lệ",
  }),
  dentistId: z
    .string({ message: "Vui lòng chọn bác sĩ điều trị" })
    .uuid("ID bác sĩ không hợp lệ"),
  assistant1Id: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || z.string().uuid().safeParse(val).success, {
      message: "ID điều dưỡng không hợp lệ",
    })
    .optional(),
  assistant2Id: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || z.string().uuid().safeParse(val).success, {
      message: "ID điều dưỡng không hợp lệ",
    })
    .optional(),
  clinicId: z
    .string({ message: "Vui lòng chọn chi nhánh" })
    .uuid("ID chi nhánh không hợp lệ"),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Treatment Log Form Schema (FRONTEND ONLY)
 * Dùng ở: TreatmentLogModal component với React Hook Form + zodResolver
 */
export const CreateTreatmentLogFormSchema = TreatmentLogCommonFieldsSchema;

export type CreateTreatmentLogFormData = z.infer<
  typeof CreateTreatmentLogFormSchema
>;

/**
 * Update Treatment Log Form Schema (FRONTEND ONLY)
 * Dùng ở: TreatmentLogModal component (edit mode)
 * Omit consultedServiceId và appointmentId (cannot change)
 */
export const UpdateTreatmentLogFormSchema = TreatmentLogCommonFieldsSchema.omit(
  {
    consultedServiceId: true,
    appointmentId: true,
  }
);

export type UpdateTreatmentLogFormData = z.infer<
  typeof UpdateTreatmentLogFormSchema
>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (API Request/Response Validation)
 * ============================================================================
 */

/**
 * Create Treatment Log Request Schema (BACKEND)
 * Dùng ở: Server Action createTreatmentLogAction
 */
export const CreateTreatmentLogRequestSchema = TreatmentLogCommonFieldsSchema;

export type CreateTreatmentLogRequest = z.infer<
  typeof CreateTreatmentLogRequestSchema
>;

/**
 * Update Treatment Log Request Schema (BACKEND)
 * Dùng ở: Server Action updateTreatmentLogAction
 * Cannot change: consultedServiceId, appointmentId, customerId, treatmentDate
 */
export const UpdateTreatmentLogRequestSchema =
  TreatmentLogCommonFieldsSchema.omit({
    consultedServiceId: true,
    appointmentId: true,
  });

export type UpdateTreatmentLogRequest = z.infer<
  typeof UpdateTreatmentLogRequestSchema
>;

/**
 * Get Treatment Logs Query Schema
 * Dùng ở: API Route GET /api/v1/treatment-logs
 */
export const GetTreatmentLogsQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  appointmentId: z.string().uuid().optional(),
});

export type GetTreatmentLogsQuery = z.infer<typeof GetTreatmentLogsQuerySchema>;

/**
 * Get Checked-In Appointments Query Schema
 * Dùng ở: API Route GET /api/v1/appointments/checked-in
 */
export const GetCheckedInAppointmentsQuerySchema = z.object({
  customerId: z.string({ message: "Vui lòng cung cấp ID khách hàng" }).uuid(),
});

export type GetCheckedInAppointmentsQuery = z.infer<
  typeof GetCheckedInAppointmentsQuerySchema
>;

/**
 * Treatment Log Response Schema
 * Dùng ở: Service layer để validate API response data
 * Nested structure pattern (not flattened)
 */
export const TreatmentLogResponseSchema = z.object({
  id: z.string(),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
    dateOfBirth: z.string().datetime().nullable(),
  }),
  consultedService: z.object({
    id: z.string(),
    consultedServiceName: z.string(),
    toothPositions: z.array(z.string()),
    serviceConfirmDate: z.string().datetime().nullable(),
  }),
  appointment: z.object({
    id: z.string(),
    appointmentDateTime: z.string().datetime(),
    status: z.string(),
  }),
  treatmentDate: z.string().datetime(),
  treatmentNotes: z.string(),
  nextStepNotes: z.string().nullable(),
  treatmentStatus: z.enum(TREATMENT_STATUSES),
  dentist: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  assistant1: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  assistant2: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  clinic: z.object({
    id: z.string(),
    name: z.string(),
  }),
  imageUrls: z.array(z.string()),
  xrayUrls: z.array(z.string()),
  createdBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  updatedBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TreatmentLogResponse = z.infer<typeof TreatmentLogResponseSchema>;

/**
 * Appointment for Treatment Response Schema
 * Used for checked-in appointments with nested consulted services and treatment logs
 */
export const AppointmentForTreatmentResponseSchema = z.object({
  id: z.string(),
  appointmentDateTime: z.string().datetime(),
  status: z.string(),
  checkInTime: z.string().datetime().nullable(),
  primaryDentist: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  clinic: z.object({
    id: z.string(),
    name: z.string(),
  }),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    customerCode: z.string().nullable(),
    dateOfBirth: z.string().datetime().nullable(),
    consultedServices: z.array(
      z.object({
        id: z.string(),
        consultedServiceName: z.string(),
        toothPositions: z.array(z.string()),
        serviceConfirmDate: z.string().datetime().nullable(),
        serviceStatus: z.string(),
        treatingDoctor: z
          .object({
            id: z.string(),
            fullName: z.string(),
          })
          .nullable(),
      })
    ),
  }),
  treatmentLogs: z.array(TreatmentLogResponseSchema),
});

export type AppointmentForTreatmentResponse = z.infer<
  typeof AppointmentForTreatmentResponseSchema
>;

/**
 * Checked-In Appointments List Response Schema
 */
export const CheckedInAppointmentsListResponseSchema = z.object({
  items: z.array(AppointmentForTreatmentResponseSchema),
});

export type CheckedInAppointmentsListResponse = z.infer<
  typeof CheckedInAppointmentsListResponseSchema
>;

/**
 * ============================================================================
 * DAILY VIEW SCHEMAS (Backend-calculated statistics pattern)
 * ============================================================================
 */

/**
 * Get Daily Treatment Logs Query Schema
 * Dùng ở: API Route GET /api/v1/treatment-logs/daily
 */
export const GetDailyTreatmentLogsQuerySchema = z.object({
  date: z
    .string({ message: "Vui lòng cung cấp ngày" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày phải có định dạng YYYY-MM-DD"),
  clinicId: z
    .string({ message: "Vui lòng chọn chi nhánh" })
    .uuid("ID chi nhánh không hợp lệ"),
});

export type GetDailyTreatmentLogsQuery = z.infer<
  typeof GetDailyTreatmentLogsQuerySchema
>;

/**
 * Daily Treatment Logs Statistics Schema
 * Backend-calculated statistics (giống ConsultedService và Payment patterns)
 */
export const DailyTreatmentLogsStatisticsSchema = z.object({
  totalCheckedInCustomers: z.number().int().nonnegative(),
  totalTreatedCustomers: z.number().int().nonnegative(),
  totalTreatmentLogs: z.number().int().nonnegative(),
  treatmentRate: z.number().nonnegative().max(100), // percentage (0-100)
});

export type DailyTreatmentLogsStatistics = z.infer<
  typeof DailyTreatmentLogsStatisticsSchema
>;

/**
 * Daily Treatment Logs Response Schema
 * Backend returns items + statistics (backend-calculated pattern)
 */
export const DailyTreatmentLogsResponseSchema = z.object({
  items: z.array(TreatmentLogResponseSchema),
  statistics: DailyTreatmentLogsStatisticsSchema,
});

export type DailyTreatmentLogsResponse = z.infer<
  typeof DailyTreatmentLogsResponseSchema
>;
