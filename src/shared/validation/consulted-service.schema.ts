// src/shared/validation/consulted-service.schema.ts
import { z } from "zod";
import {
  TREATMENT_STATUSES,
  type TreatmentStatus,
} from "./treatment-log.schema";
import { CUSTOMER_SOURCES } from "@/features/customers/constants";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Service Statuses
 */
export const SERVICE_STATUSES = ["Chưa chốt", "Đã chốt"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];

// Re-export TREATMENT_STATUSES from single source of truth
export { TREATMENT_STATUSES, type TreatmentStatus };

/**
 * Consulted Service Common Fields Schema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 * - Frontend: Extend với fields phù hợp cho form
 * - Backend: Extend với coerced types và server metadata
 */
const ConsultedServiceCommonFieldsSchema = z.object({
  dentalServiceId: z
    .string({ message: "Vui lòng chọn dịch vụ" })
    .min(1, "Vui lòng chọn dịch vụ"),
  quantity: z
    .number({ message: "Số lượng phải là số" })
    .int("Số lượng phải là số nguyên")
    .min(1, "Số lượng tối thiểu là 1"),
  preferentialPrice: z
    .number({ message: "Giá ưu đãi phải là số" })
    .int("Giá ưu đãi phải là số nguyên")
    .min(0, "Giá ưu đãi không thể âm"),
  toothPositions: z.array(z.string()).optional(),
  consultingDoctorId: z.string().uuid().optional().nullable(),
  saleOnlineId: z.string().uuid().optional().nullable(),
  consultingSaleId: z.string().uuid().optional().nullable(),
  treatingDoctorId: z.string().uuid().optional().nullable(),
  specificStatus: z.string().trim().optional().nullable(),
  source: z.string().trim().min(1, "Vui lòng chọn nguồn khách"), // REQUIRED like Customer
  sourceNote: z.string().trim().optional().nullable(),
  stage: z.string().trim().optional().nullable(),
});

/**
 * Shared Conditional Validation Function
 * Business rules:
 * - Rule 1: If unit === "Răng" → toothPositions required
 * - Rule 2: preferentialPrice validation:
 *   - Must be 0 (free) OR between [minPrice, price]
 *   - Invalid: 0 < preferentialPrice < minPrice
 */
const validateConsultedServiceConditionalFields = (
  data: {
    consultedServiceUnit?: string;
    toothPositions?: string[];
    preferentialPrice?: number;
    minPrice?: number;
    price?: number;
  },
  ctx: z.RefinementCtx
) => {
  // Rule 1: Tooth positions required if unit is "Răng"
  if (
    data.consultedServiceUnit === "Răng" &&
    (!data.toothPositions || data.toothPositions.length === 0)
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Vui lòng chọn vị trí răng",
      path: ["toothPositions"],
    });
  }

  // Rule 2: Preferential price validation
  if (
    data.preferentialPrice !== undefined &&
    data.minPrice !== undefined &&
    data.price !== undefined
  ) {
    const { preferentialPrice, minPrice, price } = data;

    // Valid: 0 (free) OR [minPrice, price]
    // Invalid: 0 < preferentialPrice < minPrice
    if (preferentialPrice > 0 && preferentialPrice < minPrice) {
      ctx.addIssue({
        code: "custom",
        message: `Giá ưu đãi phải là 0 (miễn phí) hoặc từ ${minPrice.toLocaleString()} đến ${price.toLocaleString()}`,
        path: ["preferentialPrice"],
      });
    }

    if (preferentialPrice > price) {
      ctx.addIssue({
        code: "custom",
        message: `Giá ưu đãi không được vượt quá giá niêm yết ${price.toLocaleString()}`,
        path: ["preferentialPrice"],
      });
    }
  }
};

/**
 * Validate sourceNote based on source's noteType (same as Customer)
 * - "text_input_required" → sourceNote REQUIRED
 * - "text_input_optional" → sourceNote optional
 * - "employee_search" → sourceNote optional (employeeId)
 * - "customer_search" → sourceNote optional (customerId)
 * - "none" → sourceNote should be empty/null
 */
const validateSourceNoteConditional = (
  data: {
    source?: string;
    sourceNote?: string | null;
  },
  ctx: z.RefinementCtx
) => {
  if (!data.source) return; // source is required by base schema

  const sourceMeta = CUSTOMER_SOURCES.find((s) => s.value === data.source);
  if (!sourceMeta) return;

  if (sourceMeta.noteType === "text_input_required") {
    if (!data.sourceNote || data.sourceNote.trim() === "") {
      ctx.addIssue({
        code: "custom",
        message: "Vui lòng nhập ghi chú nguồn",
        path: ["sourceNote"],
      });
    }
  }
};

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Consulted Service Form Schema (FRONTEND ONLY)
 * Dùng ở: CreateConsultedServiceModal với React Hook Form + zodResolver
 */
export const CreateConsultedServiceFormSchema =
  ConsultedServiceCommonFieldsSchema.extend({
    customerId: z
      .string({ message: "Khách hàng không hợp lệ" })
      .min(1, "Khách hàng không hợp lệ"),
    clinicId: z
      .string({ message: "Vui lòng chọn chi nhánh" })
      .min(1, "Vui lòng chọn chi nhánh"),
    // Hidden fields for validation context (auto-filled from DentalService)
    consultedServiceUnit: z.string().optional(),
    minPrice: z.number().optional(),
    price: z.number().optional(),
  })
    .superRefine(validateConsultedServiceConditionalFields)
    .superRefine(validateSourceNoteConditional);

export type CreateConsultedServiceFormData = z.infer<
  typeof CreateConsultedServiceFormSchema
>;

/**
 * Update Consulted Service Form Schema (FRONTEND ONLY)
 * Similar to Create but includes admin fields
 */
export const UpdateConsultedServiceFormSchema =
  ConsultedServiceCommonFieldsSchema.extend({
    serviceStatus: z.enum(SERVICE_STATUSES).optional(),
    treatmentStatus: z.enum(TREATMENT_STATUSES).optional(),
    serviceConfirmDate: z.string().optional().nullable(),
    consultationDate: z.string().optional().nullable(),
    // Hidden fields for validation context
    consultedServiceUnit: z.string().optional(),
    minPrice: z.number().optional(),
    price: z.number().optional(),
  })
    .superRefine(validateConsultedServiceConditionalFields)
    .superRefine(validateSourceNoteConditional);

export type UpdateConsultedServiceFormData = z.infer<
  typeof UpdateConsultedServiceFormSchema
>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Consulted Service Request Base Schema (BACKEND - for API)
 * Base schema for Create/Update requests from client → server
 */
const ConsultedServiceRequestBaseSchema =
  ConsultedServiceCommonFieldsSchema.extend({
    customerId: z.string().uuid("Khách hàng không hợp lệ"),
    clinicId: z.string().uuid("Chi nhánh không hợp lệ"),
  });

/**
 * Create Consulted Service Request Schema (BACKEND - API)
 * Dùng ở: Server Action createConsultedServiceAction
 */
export const CreateConsultedServiceRequestSchema =
  ConsultedServiceRequestBaseSchema.extend({
    quantity: z.number().int().min(1).default(1),
    toothPositions: z.array(z.string()).default([]),
  });

export type CreateConsultedServiceRequest = z.infer<
  typeof CreateConsultedServiceRequestSchema
>;

/**
 * Update Consulted Service Request Schema (BACKEND - API)
 * Dùng ở: Server Action updateConsultedServiceAction
 * Admin có thể edit serviceStatus, treatmentStatus, dates
 */
export const UpdateConsultedServiceRequestSchema =
  ConsultedServiceRequestBaseSchema.extend({
    serviceStatus: z.enum(SERVICE_STATUSES).optional(),
    treatmentStatus: z.enum(TREATMENT_STATUSES).optional(),
    serviceConfirmDate: z.coerce.date().optional().nullable(),
    consultationDate: z.coerce.date().optional().nullable(),
  }).partial();

export type UpdateConsultedServiceRequest = z.infer<
  typeof UpdateConsultedServiceRequestSchema
>;

/**
 * ============================================================================
 * QUERY SCHEMAS
 * ============================================================================
 */

/**
 * Get Consulted Services Query Schema
 * For listing consulted services with filters
 */
export const GetConsultedServicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
  serviceStatus: z.enum(SERVICE_STATUSES).optional(),
  treatmentStatus: z.enum(TREATMENT_STATUSES).optional(),
  sortField: z.string().default("consultationDate"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type GetConsultedServicesQuery = z.infer<
  typeof GetConsultedServicesQuerySchema
>;

/**
 * Get Consulted Services Daily Query Schema
 * For daily view with date filter
 */
export const GetConsultedServicesDailyQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày không hợp lệ"), // YYYY-MM-DD
  clinicId: z.string().uuid("Chi nhánh không hợp lệ"),
});

export type GetConsultedServicesDailyQuery = z.infer<
  typeof GetConsultedServicesDailyQuerySchema
>;

/**
 * ============================================================================
 * RESPONSE SCHEMAS
 * ============================================================================
 */

/**
 * Consulted Service Response Schema
 * Full response với relations
 */
export const ConsultedServiceResponseSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  appointmentId: z.string(),
  dentalServiceId: z.string(),
  clinicId: z.string(),
  customerClinicId: z.string().nullable().optional(), // Customer's current clinic for permission checks

  // Denormalized data
  consultedServiceName: z.string(),
  consultedServiceUnit: z.string(),
  price: z.number(),

  // Treatment details
  toothPositions: z.array(z.string()),
  specificStatus: z.string().nullable(),

  // Classification
  source: z.string().nullable(),
  sourceNote: z.string().nullable(),
  stage: z.string().nullable(),

  // Financial
  quantity: z.number(),
  preferentialPrice: z.number(),
  finalPrice: z.number(),
  amountPaid: z.number(),
  debt: z.number(),

  // Status & dates
  consultationDate: z.string().datetime(),
  serviceConfirmDate: z.string().datetime().nullable(),
  serviceStatus: z.enum(SERVICE_STATUSES),
  treatmentStatus: z.enum(TREATMENT_STATUSES),

  // Assignment
  consultingDoctorId: z.string().nullable(),
  saleOnlineId: z.string().nullable(),
  consultingSaleId: z.string().nullable(),
  treatingDoctorId: z.string().nullable(),

  // Metadata
  createdById: z.string(),
  updatedById: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Relations
  customer: z
    .object({
      id: z.string(),
      fullName: z.string(),
      customerCode: z.string().nullable(),
      dob: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .optional(),
  dentalService: z
    .object({
      id: z.string(),
      name: z.string(),
      unit: z.string(),
      price: z.number(),
      minPrice: z.number().nullable(),
      requiresFollowUp: z.boolean(),
    })
    .optional(),
  consultingDoctor: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  saleOnline: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  consultingSale: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  treatingDoctor: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .nullable(),
  createdBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional(),
  updatedBy: z
    .object({
      id: z.string(),
      fullName: z.string(),
    })
    .optional(),
  clinic: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export type ConsultedServiceResponse = z.infer<
  typeof ConsultedServiceResponseSchema
>;

/**
 * Consulted Services List Response Schema
 */
export const ConsultedServicesListResponseSchema = z.object({
  items: z.array(ConsultedServiceResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type ConsultedServicesListResponse = z.infer<
  typeof ConsultedServicesListResponseSchema
>;

/**
 * Consulted Services Daily Response Schema
 */
export const ConsultedServicesDailyResponseSchema = z.object({
  items: z.array(ConsultedServiceResponseSchema),
  count: z.number(),
  statistics: z.object({
    total: z.number(),
    confirmed: z.number(),
    unconfirmed: z.number(),
    totalValue: z.number(),
    confirmedValue: z.number(),
  }),
});

export type ConsultedServicesDailyResponse = z.infer<
  typeof ConsultedServicesDailyResponseSchema
>;
