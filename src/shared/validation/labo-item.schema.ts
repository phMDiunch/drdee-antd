// src/shared/validation/labo-item.schema.ts
import { z } from "zod";

/**
 * Labo Item Base Schema
 * Dùng làm nền cho CreateLaboItemRequestSchema và UpdateLaboItemRequestSchema
 * Chứa các field: name, description, serviceGroup, unit
 */
export const LaboItemBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Tên răng giả là bắt buộc và phải có ít nhất 2 ký tự")
    .max(200, "Tên răng giả không quá 200 ký tự"),
  description: z.string().trim().max(500).optional().nullable(),

  serviceGroup: z.string().trim().min(1, "Nhóm dịch vụ là bắt buộc"),
  unit: z.string().trim().min(1, "Đơn vị tính là bắt buộc"),

  archivedAt: z.date().optional().nullable(),
});

/**
 * Create Labo Item Request Schema
 * Dùng ở: Form create labo item (admin) + API POST /api/v1/labo-items
 * Omit archivedAt (server tự set khi archive)
 */
/** ==== Create ==== */
export const CreateLaboItemRequestSchema = LaboItemBaseSchema.omit({
  archivedAt: true,
});

/**
 * Update Labo Item Request Schema
 * Dùng ở: Form edit labo item (admin) + API PUT/PATCH /api/v1/labo-items/[id]
 * Cho phép cập nhật tất cả fields + archivedAt
 */
/** ==== Update (edit đầy đủ các trường) ==== */
export const UpdateLaboItemRequestSchema = LaboItemBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Labo Item Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 * API responses: GET /api/v1/labo-items, GET /api/v1/labo-items/[id], POST /api/v1/labo-items
 * Bao gồm tất cả fields + nested objects (createdBy, updatedBy)
 */
/** ==== Response object ==== */
export const LaboItemResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  serviceGroup: z.string(),
  unit: z.string(),
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
 * Labo Items Response Schema
 * Dùng ở: Service layer validate response của GET /api/v1/labo-items (array)
 */
/** Response (list) */
export const LaboItemsResponseSchema = z.array(LaboItemResponseSchema);

/**
 * Get Labo Items Query Schema
 * Dùng ở: Service layer validate query params của GET /api/v1/labo-items
 * Hỗ trợ: includeArchived ("0" hoặc "1") để lấy cả labo items đã archive
 */
/** Query */
export const GetLaboItemsQuerySchema = z.object({
  includeArchived: z.union([z.literal("0"), z.literal("1")]).optional(),
});

/** Types */
export type CreateLaboItemRequest = z.infer<typeof CreateLaboItemRequestSchema>;
export type UpdateLaboItemRequest = z.infer<typeof UpdateLaboItemRequestSchema>;
export type LaboItemResponse = z.infer<typeof LaboItemResponseSchema>;
