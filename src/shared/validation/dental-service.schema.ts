// src/shared/validation/dental-service.schema.ts
import { z } from "zod";

const TAG_RE = /^[A-Za-z0-9_-]{1,29}$/;

export const DentalServiceBaseSchema = z.object({
  name: z.string().trim().min(2, "Tên dịch vụ là bắt buộc").max(200),
  description: z.string().trim().max(2000).optional().nullable(),

  serviceGroup: z.string().trim().max(120).optional().nullable(),
  department: z.string().trim().max(120).optional().nullable(),
  tags: z.array(z.string().regex(TAG_RE)).max(10),

  unit: z.string().trim().min(1, "Đơn vị là bắt buộc"),
  price: z.number().int().min(0, "Giá niêm yết phải >= 0"),
  minPrice: z
    .number()
    .int()
    .min(0, "Giá nhỏ nhất phải >= 0")
    .optional()
    .nullable(),

  officialWarranty: z.string().trim().max(100).optional().nullable(),
  clinicWarranty: z.string().trim().max(100).optional().nullable(),
  origin: z.string().trim().max(200).optional().nullable(),
  avgTreatmentMinutes: z.number().int().min(0).optional().nullable(),
  avgTreatmentSessions: z.number().int().min(0).optional().nullable(),

  archivedAt: z.date().optional().nullable(),
});

/** ==== Create ==== */
export const CreateDentalServiceRequestSchema = DentalServiceBaseSchema.omit({
  archivedAt: true,
});

/** ==== Update (edit đầy đủ các trường) ==== */
export const UpdateDentalServiceRequestSchema = DentalServiceBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/** ==== Response object ==== */
export const DentalServiceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  serviceGroup: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  tags: z.array(z.string()),
  unit: z.string(),
  price: z.number().int(),
  minPrice: z.number().int().nullable().optional(),
  officialWarranty: z.string().nullable().optional(),
  clinicWarranty: z.string().nullable().optional(),
  origin: z.string().nullable().optional(),
  avgTreatmentMinutes: z.number().int().nullable().optional(),
  avgTreatmentSessions: z.number().int().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Response (list) */
export const DentalServicesResponseSchema = z.array(
  DentalServiceResponseSchema
);

/** Query */
export const GetDentalServicesQuerySchema = z.object({
  includeArchived: z.union([z.literal("0"), z.literal("1")]).optional(),
});

/** Types */
export type CreateDentalServiceRequest = z.infer<
  typeof CreateDentalServiceRequestSchema
>;
export type UpdateDentalServiceRequest = z.infer<
  typeof UpdateDentalServiceRequestSchema
>;
export type DentalServiceResponse = z.infer<typeof DentalServiceResponseSchema>;
