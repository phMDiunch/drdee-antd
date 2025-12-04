// src/shared/validation/labo-service.schema.ts
import { z } from "zod";

/**
 * Labo Service Base Schema
 * Dùng làm nền cho Create và Update schemas
 */
export const LaboServiceBaseSchema = z.object({
  supplierId: z.string().uuid("ID xưởng không hợp lệ").min(1, "Vui lòng chọn xưởng"),
  laboItemId: z.string().uuid("ID loại răng giả không hợp lệ").min(1, "Vui lòng chọn loại răng giả"),
  price: z
    .number()
    .positive("Giá phải lớn hơn 0")
    .max(100_000_000, "Giá không hợp lý (tối đa 100 triệu)"),
  warranty: z.string().min(1, "Vui lòng chọn bảo hành"),
});

/**
 * Create Labo Service Request Schema
 * Dùng ở: Form create + API POST /api/v1/labo-services
 */
export const CreateLaboServiceRequestSchema = LaboServiceBaseSchema;

/**
 * Update Labo Service Request Schema
 * Chỉ cho phép cập nhật price và warranty
 * KHÔNG cho phép thay đổi supplierId và laboItemId (xóa và tạo mới thay thế)
 */
export const UpdateLaboServiceRequestSchema = z.object({
  id: z.string().uuid("ID không hợp lệ"),
  price: z
    .number()
    .positive("Giá phải lớn hơn 0")
    .max(100_000_000, "Giá không hợp lý (tối đa 100 triệu)"),
  warranty: z.string().min(1, "Vui lòng chọn bảo hành"),
});

/**
 * Labo Service Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 * Bao gồm nested objects (supplier, laboItem)
 */
export const LaboServiceResponseSchema = z.object({
  id: z.string().uuid(),
  supplierId: z.string().uuid(),
  laboItemId: z.string().uuid(),
  price: z.number(),
  warranty: z.string(),
  createdById: z.string().uuid(),
  updatedById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Nested objects
  supplier: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
    })
    .nullable()
    .optional(),

  laboItem: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      serviceGroup: z.string(),
      unit: z.string(),
    })
    .nullable()
    .optional(),

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
 * Labo Services Response Schema (Array)
 * Dùng ở: Service layer validate response của GET /api/v1/labo-services
 */
export const LaboServicesResponseSchema = z.array(LaboServiceResponseSchema);

/**
 * Get Labo Services Query Schema
 * Dùng ở: Service layer validate query params
 */
export const GetLaboServicesQuerySchema = z.object({
  sortBy: z.enum(["price", "name"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  supplierId: z.string().uuid().optional(), // Filter by supplier
});

/** Types */
export type CreateLaboServiceRequest = z.infer<typeof CreateLaboServiceRequestSchema>;
export type UpdateLaboServiceRequest = z.infer<typeof UpdateLaboServiceRequestSchema>;
export type LaboServiceResponse = z.infer<typeof LaboServiceResponseSchema>;
