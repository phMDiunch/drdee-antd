// src/shared/validation/clinic.schema.ts
import { z } from "zod";

// Regex đơn giản cho số điện thoại VN: 0xxxxxxxxx (10 số)
export const VN_PHONE_RE = /^(0)\d{9}$/;
// Mã màu hex 6 ký tự
export const HEX6_RE = /^#([0-9A-Fa-f]{6})$/;

/**
 * Clinic Base Schema
 * Dùng làm nền cho CreateClinicRequestSchema và UpdateClinicRequestSchema
 * Chứa các field cơ bản: clinicCode, name, address, phone, email, colorCode
 */
export const ClinicBaseSchema = z.object({
  clinicCode: z.string().trim().min(1, "Mã phòng khám là bắt buộc"),
  name: z.string().trim().min(1, "Tên phòng khám là bắt buộc"),
  shortName: z
    .string()
    .trim()
    .min(1, "Tên viết tắt là bắt buộc")
    .max(20, "Tên viết tắt không quá 20 ký tự"),
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

  // Company Bank Account - Required
  companyBankName: z
    .string()
    .trim()
    .min(1, "Tên ngân hàng công ty là bắt buộc"),
  companyBankAccountNo: z
    .string()
    .trim()
    .min(1, "Số tài khoản công ty là bắt buộc"),
  companyBankAccountName: z
    .string()
    .trim()
    .min(1, "Tên chủ TK công ty là bắt buộc"),

  // Personal Bank Account - Required
  personalBankName: z
    .string()
    .trim()
    .min(1, "Tên ngân hàng cá nhân là bắt buộc"),
  personalBankAccountNo: z
    .string()
    .trim()
    .min(1, "Số tài khoản cá nhân là bắt buộc"),
  personalBankAccountName: z
    .string()
    .trim()
    .min(1, "Tên chủ TK cá nhân là bắt buộc"),
});

/**
 * Create Clinic Request Schema
 * Dùng ở: Form create clinic (admin) + API POST /api/v1/clinics
 * Omit archivedAt (server tự set khi archive)
 */
/** ==== Create ==== */
export const CreateClinicRequestSchema = ClinicBaseSchema.omit({
  archivedAt: true,
});

/**
 * Update Clinic Request Schema
 * Dùng ở: Form edit clinic (admin) + API PUT/PATCH /api/v1/clinics/[id]
 * Cho phép cập nhật tất cả fields cơ bản + archivedAt
 */
/** ==== Update (edit đầy đủ các trường) ==== */
export const UpdateClinicRequestSchema = ClinicBaseSchema.extend({
  id: z.string().uuid("ID không hợp lệ"),
});

/**
 * Clinic Response Schema
 * Dùng ở: Service layer validate response trước khi trả về API
 * API responses: GET /api/v1/clinics, GET /api/v1/clinics/[id], POST /api/v1/clinics
 */
/** ==== Response object ==== */
export const ClinicResponseSchema = z.object({
  id: z.string().uuid(),
  clinicCode: z.string(),
  name: z.string(),
  shortName: z.string(),
  address: z.string(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  colorCode: z.string(),
  archivedAt: z.string().datetime().nullable().optional(),

  // Bank fields (nullable for old data without bank info)
  companyBankName: z.string().nullable().optional(),
  companyBankAccountNo: z.string().nullable().optional(),
  companyBankAccountName: z.string().nullable().optional(),
  personalBankName: z.string().nullable().optional(),
  personalBankAccountNo: z.string().nullable().optional(),
  personalBankAccountName: z.string().nullable().optional(),

  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Clinics Response Schema
 * Dùng ở: Service layer validate response của GET /api/v1/clinics (array of clinics)
 */
/** Response (list) */
export const ClinicsResponseSchema = z.array(ClinicResponseSchema);

/**
 * Get Clinics Query Schema
 * Dùng ở: Service layer validate query params của GET /api/v1/clinics
 * Hỗ trợ: includeArchived ("0" hoặc "1") để lấy cả clinics đã archive
 */
/** Query */
export const GetClinicsQuerySchema = z.object({
  includeArchived: z.union([z.literal("0"), z.literal("1")]).optional(),
});

/** Types */
export type CreateClinicRequest = z.infer<typeof CreateClinicRequestSchema>;
export type UpdateClinicRequest = z.infer<typeof UpdateClinicRequestSchema>;
export type ClinicResponse = z.infer<typeof ClinicResponseSchema>;
