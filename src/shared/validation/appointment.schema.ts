// src/shared/validation/appointment.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Appointment Statuses
 */
export const APPOINTMENT_STATUSES = [
  "Chờ xác nhận",
  "Đã xác nhận",
  "Đã đến",
  "Đến đột xuất",
  "Không đến",
  "Đã hủy",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/**
 * Appointment Common Fields Schema
 * Base schema chứa tất cả fields NGOẠI TRỪ `appointmentDateTime`
 * Dùng để tái sử dụng cho cả Frontend (form) và Backend (API)
 * - Frontend: Extend với appointmentDateTime: string (DateTimePicker)
 * - Backend: Extend với appointmentDateTime: Date
 */
const AppointmentCommonFieldsSchema = z.object({
  customerId: z
    .string({ message: "Vui lòng chọn khách hàng" })
    .min(1, "Vui lòng chọn khách hàng"),
  duration: z
    .number()
    .int("Thời lượng phải là số nguyên")
    .min(1, "Thời lượng tối thiểu là 1 phút")
    .default(30),
  notes: z.string().trim().optional().nullable(),

  primaryDentistId: z
    .string({ message: "Vui lòng chọn bác sĩ chính" })
    .min(1, "Vui lòng chọn bác sĩ chính"),
  secondaryDentistId: z.string().uuid().optional().nullable(),
  clinicId: z.string().uuid("Vui lòng chọn chi nhánh"),

  status: z.enum(APPOINTMENT_STATUSES).default("Chờ xác nhận"),
});

/**
 * Shared Conditional Validation Function
 * Business rules:
 * - Rule 1: If checkOutTime exists → checkInTime is required (only for CREATE or explicit null)
 * - Rule 2: checkInTime < checkOutTime
 * - Rule 3: If checkInTime exists → status must be "Đã đến" or "Đến đột xuất"
 */
const validateAppointmentConditionalFields = (
  data: {
    checkInTime?: Date | string | null;
    checkOutTime?: Date | string | null;
    status?: string;
  },
  ctx: z.RefinementCtx
) => {
  const checkInTime = data.checkInTime ? new Date(data.checkInTime) : undefined;
  const checkOutTime = data.checkOutTime
    ? new Date(data.checkOutTime)
    : undefined;

  // Rule 1: If checkOutTime exists AND checkInTime explicitly set to null → error
  // (For partial updates: if checkInTime is undefined, it means "don't change", so skip validation)
  if (checkOutTime && data.checkInTime === null) {
    ctx.addIssue({
      code: "custom",
      message: "Phải có thời gian check-in trước khi check-out",
      path: ["checkInTime"],
    });
  }

  // Rule 2: checkInTime < checkOutTime
  if (checkInTime && checkOutTime && checkInTime >= checkOutTime) {
    ctx.addIssue({
      code: "custom",
      message: "Thời gian check-in phải trước check-out",
      path: ["checkOutTime"],
    });
  }

  // Rule 3: If checkInTime exists → status must be "Đã đến" or "Đến đột xuất"
  if (
    checkInTime &&
    data.status &&
    data.status !== "Đã đến" &&
    data.status !== "Đến đột xuất"
  ) {
    ctx.addIssue({
      code: "custom",
      message:
        'Trạng thái phải là "Đã đến" hoặc "Đến đột xuất" khi có check-in',
      path: ["status"],
    });
  }
};

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Appointment Form Schema (FRONTEND ONLY)
 * Dùng ở: CreateAppointmentModal component với React Hook Form + zodResolver
 *
 * Khác biệt với Backend schema:
 * - appointmentDateTime: string (DateTimePicker format)
 * - No checkInTime/checkOutTime (admin-only fields)
 */
export const CreateAppointmentFormSchema = AppointmentCommonFieldsSchema.extend(
  {
    appointmentDateTime: z.string().min(1, "Vui lòng chọn thời gian hẹn"),
  }
);

/**
 * Update Appointment Form Schema (FRONTEND ONLY)
 * Includes checkInTime/checkOutTime for admin edit
 */
export const UpdateAppointmentFormSchema = AppointmentCommonFieldsSchema.extend(
  {
    appointmentDateTime: z.string().min(1, "Vui lòng chọn thời gian hẹn"),
    checkInTime: z.string().optional().nullable(),
    checkOutTime: z.string().optional().nullable(),
  }
).superRefine(validateAppointmentConditionalFields);

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Appointment Request Base Schema (BACKEND - for API)
 * Base schema cho Create/Update requests từ client → server
 * - appointmentDateTime: Date (z.coerce.date auto-converts from ISO string)
 */
export const AppointmentRequestBaseSchema =
  AppointmentCommonFieldsSchema.extend({
    appointmentDateTime: z.coerce.date("Thời gian hẹn không hợp lệ"),
  });

/**
 * Create Appointment Request Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/appointments (server-side)
 */
export const CreateAppointmentRequestSchema = AppointmentRequestBaseSchema;

/**
 * Update Appointment Request Schema (BACKEND - API)
 * Dùng ở: API PUT /api/v1/appointments/:id (server-side)
 * Admin có thể edit checkInTime/checkOutTime
 */
export const UpdateAppointmentRequestSchema =
  AppointmentRequestBaseSchema.extend({
    checkInTime: z.coerce.date().optional().nullable(),
    checkOutTime: z.coerce.date().optional().nullable(),
  })
    .partial()
    .superRefine(validateAppointmentConditionalFields);

/**
 * ============================================================================
 * QUERY SCHEMAS
 * ============================================================================
 */

/**
 * Get Appointments Query Schema
 * For listing appointments with filters
 */
export const GetAppointmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  clinicId: z.string().uuid().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  date: z.string().optional(), // YYYY-MM-DD format
  sortField: z.string().default("appointmentDateTime"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * Get Appointments Daily Query Schema
 * For daily view with specific date and clinic
 */
export const GetAppointmentsDailyQuerySchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD, defaults to today on server
  clinicId: z.string().uuid().optional(), // Required for admin, auto-filled for employee
});

/**
 * Check Dentist Availability Query Schema
 * For checking conflicts in time slot
 */
export const CheckDentistAvailabilityQuerySchema = z.object({
  dentistId: z.string().uuid(),
  datetime: z.string(), // ISO datetime string
  duration: z.coerce.number().int().min(1),
  excludeAppointmentId: z.string().uuid().optional(), // When editing existing appointment
});

/**
 * ============================================================================
 * RESPONSE SCHEMAS
 * ============================================================================
 */

/**
 * Appointment Response Schema
 * Single appointment with relations
 */
export const AppointmentResponseSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  appointmentDateTime: z.string().datetime(), // ISO string for client
  duration: z.number().int(),
  notes: z.string().nullable(),

  primaryDentistId: z.string().uuid(),
  secondaryDentistId: z.string().uuid().nullable(),
  clinicId: z.string().uuid(),

  status: z.enum(APPOINTMENT_STATUSES),
  checkInTime: z.string().datetime().nullable(),
  checkOutTime: z.string().datetime().nullable(),

  // Relations
  customer: z.object({
    id: z.string().uuid(),
    customerCode: z.string().nullable(),
    fullName: z.string(),
    phone: z.string().nullable(),
    dob: z.string().nullable(), // ISO date string
  }),

  primaryDentist: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    employeeCode: z.string().nullable(),
  }),

  secondaryDentist: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
      employeeCode: z.string().nullable(),
    })
    .nullable(),

  clinic: z.object({
    id: z.string().uuid(),
    clinicCode: z.string(),
    name: z.string(),
    colorCode: z.string().nullable(),
  }),

  // Metadata
  createdById: z.string().uuid(),
  updatedById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  createdBy: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
  }),

  updatedBy: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
  }),
});

/**
 * Appointments List Response Schema
 * Paginated list with metadata
 */
export const AppointmentsListResponseSchema = z.object({
  items: z.array(AppointmentResponseSchema),
  count: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
});

/**
 * Dentist Availability Response Schema
 * For conflict warnings
 */
export const DentistAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  conflicts: z.array(
    z.object({
      id: z.string().uuid(),
      appointmentDateTime: z.string().datetime(),
      duration: z.number().int(),
      customerName: z.string(),
    })
  ),
});

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

// Frontend Types
export type CreateAppointmentFormData = z.infer<
  typeof CreateAppointmentFormSchema
>;
export type UpdateAppointmentFormData = z.infer<
  typeof UpdateAppointmentFormSchema
>;

// Backend Request Types
export type CreateAppointmentRequest = z.infer<
  typeof CreateAppointmentRequestSchema
>;
export type UpdateAppointmentRequest = z.infer<
  typeof UpdateAppointmentRequestSchema
>;

// Query Types
export type GetAppointmentsQuery = z.infer<typeof GetAppointmentsQuerySchema>;
export type GetAppointmentsDailyQuery = z.infer<
  typeof GetAppointmentsDailyQuerySchema
>;
export type CheckDentistAvailabilityQuery = z.infer<
  typeof CheckDentistAvailabilityQuerySchema
>;

// Response Types
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;
export type AppointmentsListResponse = z.infer<
  typeof AppointmentsListResponseSchema
>;
export type DentistAvailabilityResponse = z.infer<
  typeof DentistAvailabilityResponseSchema
>;
