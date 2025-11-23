// src/shared/validation/material.schema.ts
import { z } from "zod";

/**
 * Material Base Schema
 * Dùng làm nền cho CreateMaterialRequestSchema và UpdateMaterialRequestSchema
 */
export const MaterialBaseSchema = z.object({
  code: z.string().regex(/^MAT\d{4}$/, "Mã vật tư không hợp lệ"),
  name: z.string().trim().min(2, "Tên vật tư là bắt buộc").max(200),
  description: z.string().trim().max(1000).optional().nullable(),

  // MasterData keys
  unit: z.string().trim().min(1, "Đơn vị tính là bắt buộc"),
  materialType: z.string().trim().min(1, "Loại vật tư là bắt buộc"),
  department: z.string().trim().min(1, "Bộ môn là bắt buộc"),
  category: z.string().trim().optional().nullable(),
  subCategory: z.string().trim().optional().nullable(),

  minStockLevel: z
    .number()
    .int()
    .min(0, "Tồn kho tối thiểu không được âm")
    .optional()
    .nullable(),
  imageUrl: z
    .string()
    .url("URL không hợp lệ")
    .optional()
    .nullable()
    .or(z.literal("")),
  tags: z
    .array(z.string()) // Array of MasterData keys from category='tag-vat-tu'
    .max(20, "Không được quá 20 tags")
    .optional()
    .default([]),

  archivedAt: z.date().optional().nullable(),
});

/**
 * Create Material Request Schema
 * Dùng ở: Form create material (admin)
 * Omit code (server tự generate), archivedAt (server tự set khi archive)
 */
export const CreateMaterialRequestSchema = MaterialBaseSchema.omit({
  code: true,
  archivedAt: true,
});

/**
 * Update Material Request Schema
 * Dùng ở: Form edit material (admin)
 * Cho phép cập nhật tất cả fields trừ code
 */
export const UpdateMaterialRequestSchema = MaterialBaseSchema.omit({
  code: true,
}).extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Material Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 */
export const MaterialResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  unit: z.string(),
  materialType: z.string(),
  department: z.string(),
  category: z.string().nullable().optional(),
  subCategory: z.string().nullable().optional(),
  minStockLevel: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  archivedAt: z.string().datetime().nullable().optional(),
  createdById: z.string().uuid(),
  updatedById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Nested objects
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

export const MaterialsResponseSchema = z.array(MaterialResponseSchema);

// TypeScript types
export type CreateMaterialRequest = z.infer<typeof CreateMaterialRequestSchema>;
export type UpdateMaterialRequest = z.infer<typeof UpdateMaterialRequestSchema>;
export type MaterialResponse = z.infer<typeof MaterialResponseSchema>;
export type MaterialsResponse = z.infer<typeof MaterialsResponseSchema>;
