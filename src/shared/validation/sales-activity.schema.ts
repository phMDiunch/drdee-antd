// src/shared/validation/sales-activity.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

/**
 * Contact Types for Sales Activities
 */
export const CONTACT_TYPES = ["call", "message", "meet"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Sales Activity Common Fields Schema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 */
const SalesActivityCommonFieldsSchema = z.object({
  contactType: z.enum(CONTACT_TYPES, {
    message: "Loại tiếp xúc không hợp lệ",
  }),
  content: z
    .string({ message: "Vui lòng nhập nội dung tiếp xúc" })
    .min(10, "Nội dung phải có ít nhất 10 ký tự")
    .max(5000, "Nội dung không được vượt quá 5000 ký tự"),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS
 * ============================================================================
 */

/**
 * Form schema for creating sales activity
 * Frontend uses string for date picker
 */
export const CreateSalesActivityFormSchema =
  SalesActivityCommonFieldsSchema.extend({
    nextContactDate: z
      .string()
      .trim()
      .transform((val) => (val === "" ? undefined : val))
      .optional(),
  });

export type CreateSalesActivityFormData = z.infer<
  typeof CreateSalesActivityFormSchema
>;

/**
 * ============================================================================
 * BACKEND REQUEST SCHEMAS
 * ============================================================================
 */

/**
 * Backend request schema for creating sales activity
 * Backend uses Date type
 */
export const CreateSalesActivityRequestSchema =
  SalesActivityCommonFieldsSchema.extend({
    consultedServiceId: z
      .string({ message: "ID dịch vụ tư vấn không hợp lệ" })
      .uuid("ID dịch vụ tư vấn không hợp lệ"),
    nextContactDate: z.coerce
      .date({ message: "Ngày hẹn tiếp xúc tiếp không hợp lệ" })
      .optional()
      .nullable(),
  });

export type CreateSalesActivityRequest = z.infer<
  typeof CreateSalesActivityRequestSchema
>;

/**
 * ============================================================================
 * BACKEND RESPONSE SCHEMAS
 * ============================================================================
 */

/**
 * Sales Activity Response Schema
 * Single activity with employee info
 */
export const SalesActivityResponseSchema = z.object({
  id: z.string(),
  consultedServiceId: z.string(),
  employeeId: z.string(),
  contactType: z.enum(CONTACT_TYPES),
  contactDate: z.string().datetime(),
  content: z.string(),
  nextContactDate: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  employee: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
});

export type SalesActivityResponse = z.infer<typeof SalesActivityResponseSchema>;

/**
 * Sales Activities List Response Schema
 * Array of activities for a consulted service
 */
export const SalesActivitiesListResponseSchema = z.array(
  SalesActivityResponseSchema
);

export type SalesActivitiesListResponse = z.infer<
  typeof SalesActivitiesListResponseSchema
>;

/**
 * ============================================================================
 * QUERY SCHEMAS
 * ============================================================================
 */

/**
 * Query schema for getting sales pipeline services
 */
export const GetSalesPipelineQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Tháng phải theo định dạng YYYY-MM"),
  clinicId: z.string().uuid("ID chi nhánh không hợp lệ").optional(),
});

export type GetSalesPipelineQuery = z.infer<typeof GetSalesPipelineQuerySchema>;

/**
 * ============================================================================
 * PIPELINE ACTIONS SCHEMAS
 * ============================================================================
 */

/**
 * Schema for claiming a pipeline service
 */
export const ClaimPipelineRequestSchema = z.object({
  consultedServiceId: z
    .string({ message: "ID dịch vụ tư vấn không hợp lệ" })
    .uuid("ID dịch vụ tư vấn không hợp lệ"),
});

export type ClaimPipelineRequest = z.infer<typeof ClaimPipelineRequestSchema>;

/**
 * Schema for reassigning a pipeline service
 */
export const ReassignSaleRequestSchema = z.object({
  consultedServiceId: z
    .string({ message: "ID dịch vụ tư vấn không hợp lệ" })
    .uuid("ID dịch vụ tư vấn không hợp lệ"),
  newSaleId: z
    .string({ message: "Vui lòng chọn sale mới" })
    .uuid("ID sale không hợp lệ"),
  reason: z.string().trim().optional(),
});

export type ReassignSaleRequest = z.infer<typeof ReassignSaleRequestSchema>;
