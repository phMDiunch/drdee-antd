// src/shared/validation/sales-activity-log.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SALES ACTIVITY LOG VALIDATION
 * ============================================================================
 */

/**
 * Contact Types
 */
export const CONTACT_TYPES = ["call", "message", "meet"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

/**
 * Contact Type Labels
 */
export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  call: "Gọi điện",
  message: "Nhắn tin",
  meet: "Gặp mặt",
};

/**
 * Sales Activity Log Common Fields Schema
 */
const SalesActivityLogCommonFieldsSchema = z.object({
  contactType: z.enum(CONTACT_TYPES, {
    message: "Vui lòng chọn loại tiếp xúc",
  }),
  content: z
    .string({ message: "Vui lòng nhập nội dung" })
    .trim()
    .min(1, "Nội dung không được để trống"),
  nextContactDate: z.string().trim().optional().nullable(),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Form Validation)
 * ============================================================================
 */

/**
 * Create Activity Log Form Schema
 */
export const CreateActivityLogFormSchema =
  SalesActivityLogCommonFieldsSchema.extend({
    contactDate: z.string().min(1, "Vui lòng chọn ngày tiếp xúc"),
  });

export type CreateActivityLogFormData = z.infer<
  typeof CreateActivityLogFormSchema
>;

/**
 * Update Activity Log Form Schema
 */
export const UpdateActivityLogFormSchema =
  SalesActivityLogCommonFieldsSchema.extend({
    contactDate: z.string().min(1, "Vui lòng chọn ngày tiếp xúc"),
  });

export type UpdateActivityLogFormData = z.infer<
  typeof UpdateActivityLogFormSchema
>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (API Validation)
 * ============================================================================
 */

/**
 * Create Activity Log Request Schema
 */
export const CreateActivityLogRequestSchema =
  SalesActivityLogCommonFieldsSchema.extend({
    consultedServiceId: z.string().uuid("ID dịch vụ không hợp lệ"),
    contactDate: z.coerce.date({ message: "Ngày tiếp xúc không hợp lệ" }),
    nextContactDate: z.coerce.date().optional().nullable(),
  });

export type CreateActivityLogRequest = z.infer<
  typeof CreateActivityLogRequestSchema
>;

/**
 * Update Activity Log Request Schema
 */
export const UpdateActivityLogRequestSchema =
  SalesActivityLogCommonFieldsSchema.extend({
    contactDate: z.coerce.date({ message: "Ngày tiếp xúc không hợp lệ" }),
    nextContactDate: z.coerce.date().optional().nullable(),
  });

export type UpdateActivityLogRequest = z.infer<
  typeof UpdateActivityLogRequestSchema
>;

/**
 * Activity Log Response Schema
 */
export const ActivityLogResponseSchema = z.object({
  id: z.string(),
  consultedServiceId: z.string(),
  contactType: z.string(),
  contactDate: z.string().datetime(),
  content: z.string(),
  nextContactDate: z.string().nullable(),
  employee: z.object({
    id: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ActivityLogResponse = z.infer<typeof ActivityLogResponseSchema>;

/**
 * Activity Logs List Response Schema
 */
export const ActivityLogsListResponseSchema = z.object({
  items: z.array(ActivityLogResponseSchema),
  count: z.number(),
});

export type ActivityLogsListResponse = z.infer<
  typeof ActivityLogsListResponseSchema
>;
