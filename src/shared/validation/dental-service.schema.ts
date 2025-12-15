// src/shared/validation/dental-service.schema.ts
import { z } from "zod";

const TAG_RE = /^[A-Za-z0-9_-]{1,29}$/;

/**
 * Dental Service Base Schema
 * Dùng làm nền cho CreateDentalServiceRequestSchema và UpdateDentalServiceRequestSchema
 * Chứa các field: name, description, serviceGroup, department, tags, unit, price, warranty, origin...
 */
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

  // Follow-up & Payment Configuration
  requiresFollowUp: z.boolean(),
  paymentAccountType: z.enum(["COMPANY", "PERSONAL"]),

  archivedAt: z.date().optional().nullable(),
});

/**
 * Create Dental Service Request Schema
 * Dùng ở: Form create service (admin) + API POST /api/v1/dental-services
 * Omit archivedAt (server tự set khi archive)
 */
/** ==== Create ==== */
export const CreateDentalServiceRequestSchema = DentalServiceBaseSchema.omit({
  archivedAt: true,
});

/**
 * Update Dental Service Request Schema
 * Dùng ở: Form edit service (admin) + API PUT/PATCH /api/v1/dental-services/[id]
 * Cho phép cập nhật tất cả fields + archivedAt
 */
/** ==== Update (edit đầy đủ các trường) ==== */
export const UpdateDentalServiceRequestSchema = DentalServiceBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Dental Service Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 * API responses: GET /api/v1/dental-services, GET /api/v1/dental-services/[id], POST /api/v1/dental-services
 * Bao gồm tất cả fields + nested objects (createdBy, updatedBy)
 */
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
  requiresFollowUp: z.boolean(),
  paymentAccountType: z.enum(["COMPANY", "PERSONAL"]),
  archivedAt: z.string().datetime().nullable().optional(),
  createdById: z.string().uuid(),
  updatedById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Nested objects - bao gồm cả id để dễ dàng reference
  createdBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),
  updatedBy: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
    })
    .nullable()
    .optional(),
});

/**
 * Dental Services Response Schema
 * Dùng ở: Service layer validate response của GET /api/v1/dental-services (array)
 */
/** Response (list) */
export const DentalServicesResponseSchema = z.array(
  DentalServiceResponseSchema
);

/**
 * Get Dental Services Query Schema
 * Dùng ở: Service layer validate query params của GET /api/v1/dental-services
 * Hỗ trợ: includeArchived ("0" hoặc "1") để lấy cả services đã archive
 */
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
