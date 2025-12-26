// src/shared/validation/sales-activity.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Contact Types - Sales Activity contact methods
 */
export const CONTACT_TYPES = ["call", "message", "meet"] as const;

export type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * Sales Activity Common Fields Schema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 * Dùng để tái sử dụng cho cả Create và Update
 */
const SalesActivityCommonFieldsSchema = z.object({
  consultedServiceId: z
    .string({ message: "Vui lòng chọn dịch vụ tư vấn" })
    .uuid("ID dịch vụ không hợp lệ"),
  contactType: z.enum(CONTACT_TYPES, {
    message: "Loại liên hệ không hợp lệ",
  }),
  content: z
    .string({ message: "Vui lòng nhập nội dung trao đổi" })
    .min(10, "Nội dung trao đổi phải có ít nhất 10 ký tự")
    .max(5000, "Nội dung trao đổi không được vượt quá 5000 ký tự"),
});

/**
 * Shared Validation Function: contactDate must be <= now
 */
function validateContactDate(
  data: { contactDate: Date },
  ctx: z.RefinementCtx
) {
  const now = new Date();
  if (data.contactDate > now) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contactDate"],
      message: "Ngày giờ liên hệ không được trong tương lai",
    });
  }
}

/**
 * Shared Validation Function: nextContactDate must be > contactDate
 */
function validateNextContactDate(
  data: { contactDate: Date; nextContactDate?: Date | null },
  ctx: z.RefinementCtx
) {
  if (data.nextContactDate) {
    // Compare dates only (ignore time)
    const contactDateOnly = new Date(data.contactDate);
    contactDateOnly.setHours(0, 0, 0, 0);

    const nextContactDateOnly = new Date(data.nextContactDate);
    nextContactDateOnly.setHours(0, 0, 0, 0);

    if (nextContactDateOnly <= contactDateOnly) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nextContactDate"],
        message: "Ngày follow-up phải sau ngày liên hệ",
      });
    }
  }
}

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Sales Activity Form Schema (FRONTEND ONLY)
 * Dùng ở: SalesActivityModal component với React Hook Form + zodResolver
 */
export const CreateSalesActivityFormSchema =
  SalesActivityCommonFieldsSchema.extend({
    contactDate: z.string().min(1, "Vui lòng chọn ngày giờ liên hệ"), // STRING for DatePicker
    nextContactDate: z
      .string()
      .nullable()
      .optional()
      .transform((val) => (val === "" || val === null ? null : val)), // Allow empty string
  }).superRefine((data, ctx) => {
    // Convert string dates to Date objects for validation
    const contactDate = new Date(data.contactDate);
    const nextContactDate = data.nextContactDate
      ? new Date(data.nextContactDate)
      : null;

    validateContactDate({ contactDate }, ctx);
    validateNextContactDate({ contactDate, nextContactDate }, ctx);
  });

export type CreateSalesActivityFormData = z.infer<
  typeof CreateSalesActivityFormSchema
>;

/**
 * Update Sales Activity Form Schema (FRONTEND ONLY)
 * Dùng ở: SalesActivityModal component (edit mode)
 * Cannot change consultedServiceId
 */
export const UpdateSalesActivityFormSchema =
  SalesActivityCommonFieldsSchema.omit({
    consultedServiceId: true,
  })
    .extend({
      contactDate: z.string().min(1, "Vui lòng chọn ngày giờ liên hệ"),
      nextContactDate: z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val === "" || val === null ? null : val)),
    })
    .superRefine((data, ctx) => {
      const contactDate = new Date(data.contactDate);
      const nextContactDate = data.nextContactDate
        ? new Date(data.nextContactDate)
        : null;

      validateContactDate({ contactDate }, ctx);
      validateNextContactDate({ contactDate, nextContactDate }, ctx);
    });

export type UpdateSalesActivityFormData = z.infer<
  typeof UpdateSalesActivityFormSchema
>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (API Request/Response Validation)
 * ============================================================================
 */

/**
 * Create Sales Activity Request Schema (BACKEND)
 * Dùng ở: createSalesActivityAction
 */
export const CreateSalesActivityRequestSchema =
  SalesActivityCommonFieldsSchema.extend({
    contactDate: z.coerce.date(), // DATE for API
    nextContactDate: z.coerce
      .date()
      .nullable()
      .optional()
      .transform((val) => val || null), // Normalize undefined to null
  }).superRefine((data, ctx) => {
    validateContactDate(data, ctx);
    validateNextContactDate(data, ctx);
  });

export type CreateSalesActivityRequest = z.infer<
  typeof CreateSalesActivityRequestSchema
>;

/**
 * Update Sales Activity Request Schema (BACKEND)
 * Dùng ở: updateSalesActivityAction
 */
export const UpdateSalesActivityRequestSchema =
  SalesActivityCommonFieldsSchema.omit({
    consultedServiceId: true,
  })
    .extend({
      contactDate: z.coerce.date(),
      nextContactDate: z.coerce
        .date()
        .nullable()
        .optional()
        .transform((val) => val || null),
    })
    .partial() // All fields optional for update
    .superRefine((data, ctx) => {
      if (data.contactDate) {
        validateContactDate({ contactDate: data.contactDate }, ctx);
      }
      if (data.contactDate && data.nextContactDate !== undefined) {
        validateNextContactDate(
          {
            contactDate: data.contactDate,
            nextContactDate: data.nextContactDate,
          },
          ctx
        );
      }
    });

export type UpdateSalesActivityRequest = z.infer<
  typeof UpdateSalesActivityRequestSchema
>;

/**
 * Get Sales Activities Query Schema (BACKEND)
 * Dùng ở: GET /api/v1/sales-activities
 */
export const GetSalesActivitiesQuerySchema = z.object({
  customerId: z.string().uuid().optional(),
  consultedServiceId: z.string().uuid().optional(),
  saleId: z.string().uuid().optional(),
  pageSize: z.coerce.number().int().min(1).max(500).default(200),
  sortField: z.enum(["contactDate", "createdAt"]).default("contactDate"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type GetSalesActivitiesQuery = z.infer<
  typeof GetSalesActivitiesQuerySchema
>;

/**
 * Sales Activity Response Schema (BACKEND)
 * Dùng ở: API response mapping
 */
export const SalesActivityResponseSchema = z.object({
  id: z.string(),
  consultedServiceId: z.string(),
  saleId: z.string(),
  contactType: z.enum(CONTACT_TYPES),
  contactDate: z.string().datetime(), // ISO string
  content: z.string(),
  nextContactDate: z.string().nullable(), // ISO date string
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Nested relations
  consultedService: z.object({
    id: z.string(),
    consultedServiceName: z.string(),
    stage: z.string().nullable(),
    customer: z.object({
      id: z.string(),
      fullName: z.string(),
      phone: z.string().nullable(),
      customerCode: z.string().nullable(),
      dob: z.string().nullable(), // ISO date string
    }),
  }),
  sale: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
});

export type SalesActivityResponse = z.infer<typeof SalesActivityResponseSchema>;

/**
 * Sales Activities List Response Schema (BACKEND)
 * Dùng ở: GET /api/v1/sales-activities response
 */
export const SalesActivitiesListResponseSchema = z.object({
  items: z.array(SalesActivityResponseSchema),
  total: z.number().int().min(0),
});

export type SalesActivitiesListResponse = z.infer<
  typeof SalesActivitiesListResponseSchema
>;

/**
 * Daily Sales Activities Response Schema (BACKEND)
 * Dùng ở: GET /api/v1/sales-activities/daily response
 */
export const DailySalesActivitiesResponseSchema = z.object({
  items: z.array(SalesActivityResponseSchema),
  statistics: z.object({
    totalActivities: z.number().int().min(0),
    totalCustomers: z.number().int().min(0),
    totalServices: z.number().int().min(0),
    contactTypeDistribution: z.object({
      call: z.number().int().min(0),
      message: z.number().int().min(0),
      meet: z.number().int().min(0),
    }),
  }),
});

export type DailySalesActivitiesResponse = z.infer<
  typeof DailySalesActivitiesResponseSchema
>;
