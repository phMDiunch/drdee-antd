// src/shared/validation/lead.schema.ts
import { z } from "zod";
import { CustomerResponseSchema } from "./customer.schema";
import { VN_PHONE_RE } from "./clinic.schema";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 * Lead uses Customer table with type="LEAD"
 * Required fields: phone, fullName, city
 * clinicId is always NULL (not used, not shown in form)
 */

/**
 * Lead Common Fields Schema
 * Base schema chứa tất cả fields dùng chung cho Lead
 * Tái sử dụng cho Create/Update requests
 */
const LeadCommonFieldsSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Số điện thoại phải có ít nhất 10 ký tự")
    .max(15, "Số điện thoại không được quá 15 ký tự")
    .refine((val) => VN_PHONE_RE.test(val), {
      message: "Số điện thoại không hợp lệ",
    }),
  fullName: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập họ và tên")
    .max(200, "Họ và tên không được quá 200 ký tự"),
  city: z.string().trim().min(1, "Vui lòng chọn tỉnh/thành phố"),
  district: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  note: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  source: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  sourceNotes: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  serviceOfInterest: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  primaryContactId: z
    .string()
    .uuid()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
  primaryContactRole: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
});

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Create Lead Request Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/leads (server-side)
 * Service layer validate request từ client trước khi ghi database
 */
export const CreateLeadRequestSchema = LeadCommonFieldsSchema;

/**
 * Update Lead Request Schema (BACKEND - API)
 * Dùng ở: API PUT/PATCH /api/v1/leads/[id] (server-side)
 * Partial update - all fields optional
 */
export const UpdateLeadRequestSchema = LeadCommonFieldsSchema.partial();

/**
 * Lead Response Schema
 * Extends CustomerResponseSchema with source relations
 * Used in list views where sourceEmployee/sourceCustomer need to be displayed
 */
export const LeadResponseSchema = CustomerResponseSchema.extend({
  // Source Employee relation (conditional - only when source = 'employee_referral')
  sourceEmployee: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
      phone: z.string().nullable(),
    })
    .nullable()
    .optional(),

  // Source Customer relation (conditional - only when source = 'customer_referral')
  sourceCustomer: z
    .object({
      id: z.string().uuid(),
      customerCode: z.string().nullable(),
      fullName: z.string(),
      phone: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export type LeadResponse = z.infer<typeof LeadResponseSchema>;

/**
 * Leads List Response Schema
 * Dùng ở: Service layer validate response của GET /api/v1/leads
 */
export const LeadsListResponseSchema = z.object({
  items: z.array(LeadResponseSchema),
  count: z.number(),
});

/**
 * Convert Lead to Customer Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/leads/[id]/convert (server-side)
 * Convert lead sang customer - Must match CustomerFormModal requirements
 */
export const ConvertLeadRequestSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự")
      .max(200, "Họ và tên không được quá 200 ký tự"),
    dob: z.coerce.date().nullable().optional(),
    gender: z.string().trim().min(1, "Vui lòng chọn giới tính"),

    phone: z
      .string()
      .trim()
      .transform((val) => (val === "" ? null : val))
      .nullable()
      .refine((val) => val === null || VN_PHONE_RE.test(val), {
        message: "Số điện thoại không hợp lệ",
      }),

    email: z
      .string()
      .trim()
      .transform((val) => (val === "" ? null : val))
      .nullable()
      .refine(
        (val) => val === null || z.string().email().safeParse(val).success,
        {
          message: "Email không hợp lệ",
        }
      ),

    address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
    city: z.string().trim().min(1, "Vui lòng chọn tỉnh/thành phố"),
    district: z.string().trim().min(1, "Vui lòng chọn quận/huyện"),

    primaryContactRole: z.string().trim().optional().nullable(),
    primaryContactId: z.string().uuid().optional().nullable(),

    clinicId: z.string().uuid("Phòng khám không hợp lệ"),
    serviceOfInterest: z
      .string()
      .trim()
      .min(1, "Vui lòng chọn dịch vụ quan tâm"),
    source: z.string().trim().min(1, "Vui lòng chọn nguồn khách hàng"),

    occupation: z.string().trim().optional().nullable(),
    sourceNotes: z.string().trim().optional().nullable(),
    note: z.string().trim().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Rule 1: If no phone, then primaryContactId + primaryContactRole are required
    if (!data.phone) {
      if (!data.primaryContactId) {
        ctx.addIssue({
          code: "custom",
          message: "Nhập số điện thoại hoặc chọn người liên hệ chính",
          path: ["primaryContactId"],
        });
      }
      if (!data.primaryContactRole) {
        ctx.addIssue({
          code: "custom",
          message: "Nhập vai trò người liên hệ",
          path: ["primaryContactRole"],
        });
      }
    }
  });

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */
export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;
export type UpdateLeadRequest = z.infer<typeof UpdateLeadRequestSchema>;
export type LeadsListResponse = z.infer<typeof LeadsListResponseSchema>;
export type ConvertLeadRequest = z.infer<typeof ConvertLeadRequestSchema>;
