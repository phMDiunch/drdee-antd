// src/shared/validation/supplier.schema.ts
import { z } from "zod";

/**
 * Supplier Base Schema
 * Dùng làm nền cho CreateSupplierRequestSchema và UpdateSupplierRequestSchema
 */
export const SupplierBaseSchema = z.object({
  name: z.string().trim().min(2, "Tên NCC là bắt buộc").max(200),
  shortName: z.string().trim().max(50).optional().nullable(),
  supplierGroup: z.string().trim().optional().nullable(), // Optional - from MasterData category='nhom-nha-cung-cap'
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "SĐT không hợp lệ")
    .max(20)
    .optional()
    .nullable(),
  email: z.string().email("Email không hợp lệ").optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  taxCode: z.string().trim().max(20).optional().nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
  archivedAt: z.date().optional().nullable(),
});

/**
 * Create Supplier Request Schema
 * Dùng ở: Form create supplier (admin)
 * Omit archivedAt (server tự set khi archive)
 */
export const CreateSupplierRequestSchema = SupplierBaseSchema.omit({
  archivedAt: true,
});

/**
 * Update Supplier Request Schema
 * Dùng ở: Form edit supplier (admin)
 * Cho phép cập nhật tất cả fields + archivedAt
 */
export const UpdateSupplierRequestSchema = SupplierBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Supplier Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 */
export const SupplierResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  shortName: z.string().nullable().optional(),
  supplierGroup: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  taxCode: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
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

export const SuppliersResponseSchema = z.array(SupplierResponseSchema);

/**
 * Get Suppliers Query Schema
 * Dùng ở: Service layer validate query params của GET /api/v1/suppliers
 * Hỗ trợ: includeArchived ("0" hoặc "1") để lấy cả suppliers đã archive
 */
export const GetSuppliersQuerySchema = z.object({
  includeArchived: z.union([z.literal("0"), z.literal("1")]).optional(),
});

// TypeScript types
export type CreateSupplierRequest = z.infer<typeof CreateSupplierRequestSchema>;
export type UpdateSupplierRequest = z.infer<typeof UpdateSupplierRequestSchema>;
export type SupplierResponse = z.infer<typeof SupplierResponseSchema>;
export type SuppliersResponse = z.infer<typeof SuppliersResponseSchema>;
