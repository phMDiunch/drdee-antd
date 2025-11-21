// src/shared/validation/master-data.schema.ts
import { z } from "zod";
import { MASTER_DATA_TYPE_LIST } from "@/shared/constants/master-data";

/**
 * Base Schema - Shared fields
 */
export const MasterDataBaseSchema = z.object({
  type: z.enum(MASTER_DATA_TYPE_LIST as [string, ...string[]], {
    message: "Vui lòng chọn loại danh mục",
  }),

  key: z
    .string()
    .trim()
    .min(2, "Mã phải có ít nhất 2 ký tự")
    .max(50, "Mã không được quá 50 ký tự")
    .regex(/^[a-z0-9-]+$/, "Mã chỉ chứa chữ thường, số và dấu gạch ngang"),

  value: z
    .string()
    .trim()
    .min(2, "Tên hiển thị phải có ít nhất 2 ký tự")
    .max(100, "Tên không được quá 100 ký tự"),

  description: z.string().trim().max(500).optional().nullable(),

  parentId: z.string().uuid().optional().nullable(),

  isActive: z.boolean().default(true),
});

/**
 * Create Schema
 */
export const CreateMasterDataRequestSchema = MasterDataBaseSchema;

/**
 * Update Schema
 */
export const UpdateMasterDataRequestSchema = MasterDataBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Response Schema (Single)
 */
export const MasterDataResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  key: z.string(),
  value: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
  parentId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Response Schema (List)
 */
export const MasterDataListResponseSchema = z.array(MasterDataResponseSchema);

/**
 * Query Schema (for GET /api/v1/master-data)
 */
export const GetMasterDataQuerySchema = z.object({
  type: z.enum(MASTER_DATA_TYPE_LIST as [string, ...string[]]).optional(),
  includeInactive: z.boolean().optional(),
});

/**
 * Types
 */
export type CreateMasterDataRequest = z.infer<
  typeof CreateMasterDataRequestSchema
>;
export type UpdateMasterDataRequest = z.infer<
  typeof UpdateMasterDataRequestSchema
>;
export type MasterDataResponse = z.infer<typeof MasterDataResponseSchema>;
export type GetMasterDataQuery = z.infer<typeof GetMasterDataQuerySchema>;
