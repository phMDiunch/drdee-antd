// src/shared/validation/clinic.schema.ts
import { z } from "zod";

// Regex đơn giản cho số điện thoại VN: 0xxxxxxxxx (10 số)
export const VN_PHONE_RE = /^(0)\d{9}$/;
// Mã màu hex 6 ký tự
export const HEX6_RE = /^#([0-9A-Fa-f]{6})$/;

export const ClinicBaseSchema = z.object({
  clinicCode: z.string().trim().min(1, "Mã phòng khám là bắt buộc"),
  name: z.string().trim().min(1, "Tên phòng khám là bắt buộc"),
  address: z.string().trim().min(1, "Địa chỉ là bắt buộc"),
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_RE, "Số điện thoại không hợp lệ")
    .optional()
    .nullable(),
  email: z.string().trim().email("Email không hợp lệ").optional().nullable(),
  colorCode: z.string().trim().regex(HEX6_RE, "Mã màu là bắt buộc"),
  archivedAt: z.date().optional().nullable(), // client gửi khi cần; server set khi archive
});

/** ==== Create ==== */
export const CreateClinicRequestSchema = ClinicBaseSchema.omit({
  archivedAt: true,
});

/** ==== Update (edit đầy đủ các trường) ==== */
export const UpdateClinicRequestSchema = ClinicBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/** ==== Response object ==== */
export const ClinicResponseSchema = z.object({
  id: z.string().uuid(),
  clinicCode: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  colorCode: z.string(),
  archivedAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/** Response (list) */
export const ClinicsResponseSchema = z.array(ClinicResponseSchema);

/** Query */
export const GetClinicsQuerySchema = z.object({
  includeArchived: z.union([z.literal("0"), z.literal("1")]).optional(),
});

/** Types */
export type CreateClinicRequest = z.infer<typeof CreateClinicRequestSchema>;
export type UpdateClinicRequest = z.infer<typeof UpdateClinicRequestSchema>;
export type ClinicResponse = z.infer<typeof ClinicResponseSchema>;
