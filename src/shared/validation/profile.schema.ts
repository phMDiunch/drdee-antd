// src/shared/validation/profile.schema.ts
import { z } from "zod";

// Reuse regex patterns from employee.schema
export const VN_PHONE_RE = /^(0)\d{9}$/;
export const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;
export const VN_NATIONAL_ID_RE = /^(?:\d{9}|\d{12})$/;
export const BANK_ACCOUNT_RE = /^[0-9]{6,20}$/;

/**
 * ============================================================================
 * BASE SCHEMAS (Shared validation rules)
 * ============================================================================
 */

/**
 * Profile Common Fields Schema
 * Contains all editable profile fields (excluding work info which is read-only)
 */
const ProfileCommonFieldsSchema = z.object({
  // Thông tin cơ bản
  fullName: z.string().trim().min(1, "Họ tên không được để trống").max(100),
  gender: z.string().trim().optional().nullable(),
  favoriteColor: z
    .string()
    .regex(HEX6_RE, "Màu yêu thích phải là mã hex (ví dụ: #FF5733)")
    .optional()
    .nullable(),

  // Thông tin liên hệ
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_RE, "Số điện thoại không hợp lệ (ví dụ: 0912345678)")
    .optional()
    .nullable(),
  currentAddress: z.string().trim().max(255).optional().nullable(),
  hometown: z.string().trim().max(255).optional().nullable(),

  // Thông tin pháp lý
  nationalId: z
    .string()
    .trim()
    .regex(VN_NATIONAL_ID_RE, "Số CCCD phải gồm 9 hoặc 12 chữ số")
    .optional()
    .nullable(),
  nationalIdIssuePlace: z.string().trim().max(255).optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  insuranceNumber: z.string().trim().max(20).optional().nullable(),

  // Thông tin ngân hàng
  bankAccountNumber: z
    .string()
    .trim()
    .regex(BANK_ACCOUNT_RE, "Số tài khoản ngân hàng phải từ 6-20 chữ số")
    .optional()
    .nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Update Profile Form Schema (FRONTEND ONLY)
 * Dùng ở: Profile page components với React Hook Form + zodResolver
 *
 * Khác biệt với Backend schema:
 * - dob: Date object (DatePicker onChange returns Date, not string)
 * - nationalIdIssueDate: Date object (DatePicker)
 * - avatarUrl: Optional URL string
 *
 * Flow: User input → Validate (Date object) → onSubmit → Convert to ISO string → API
 */
export const UpdateProfileFormSchema = ProfileCommonFieldsSchema.extend({
  dob: z.date("Ngày sinh không hợp lệ").optional().nullable(),
  nationalIdIssueDate: z.date("Ngày cấp không hợp lệ").optional().nullable(),
  avatarUrl: z.string().url("URL ảnh không hợp lệ").optional().nullable(),
});

/**
 * PARTIAL SCHEMAS FOR EACH TAB (FRONTEND ONLY)
 * Chỉ validate các trường hiển thị trong từng tab để tối ưu validation
 */

// Tab "Cơ bản"
export const BasicInfoFormSchema = z.object({
  fullName: z.string().trim().min(1, "Họ tên không được để trống").max(100),
  dob: z.date("Ngày sinh không hợp lệ").optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  favoriteColor: z
    .string()
    .regex(HEX6_RE, "Màu yêu thích phải là mã hex (ví dụ: #FF5733)")
    .optional()
    .nullable(),
  avatarUrl: z.string().url("URL ảnh không hợp lệ").optional().nullable(),
});

// Tab "Liên hệ"
export const ContactInfoFormSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_RE, "Số điện thoại không hợp lệ (ví dụ: 0912345678)")
    .optional()
    .nullable(),
  currentAddress: z.string().trim().max(255).optional().nullable(),
  hometown: z.string().trim().max(255).optional().nullable(),
});

// Tab "Pháp lý"
export const LegalInfoFormSchema = z.object({
  nationalId: z
    .string()
    .trim()
    .regex(VN_NATIONAL_ID_RE, "Số CCCD phải gồm 9 hoặc 12 chữ số")
    .optional()
    .nullable(),
  nationalIdIssueDate: z.date("Ngày cấp không hợp lệ").optional().nullable(),
  nationalIdIssuePlace: z.string().trim().max(255).optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  insuranceNumber: z.string().trim().max(20).optional().nullable(),
});

// Tab "Ngân hàng"
export const BankingInfoFormSchema = z.object({
  bankAccountNumber: z
    .string()
    .trim()
    .regex(BANK_ACCOUNT_RE, "Số tài khoản ngân hàng phải từ 6-20 chữ số")
    .optional()
    .nullable(),
  bankName: z.string().trim().max(100).optional().nullable(),
});

/**
 * Change Password Form Schema (FRONTEND ONLY)
 * Dùng ở: ChangePasswordForm component
 */
export const ChangePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Update Profile Request Schema (BACKEND - API)
 * Dùng ở: API PATCH /api/v1/profile (server-side)
 * Service layer validate request từ client trước khi ghi database
 *
 * Khác với FormSchema:
 * - dob: z.coerce.date() (auto-convert từ ISO string/Date object)
 * - nationalIdIssueDate: z.coerce.date()
 * - fullName: Optional (cho phép partial update - chỉ gửi trường thay đổi)
 */
export const UpdateProfileRequestSchema =
  ProfileCommonFieldsSchema.partial().extend({
    dob: z.coerce.date("Ngày sinh không hợp lệ").optional().nullable(),
    nationalIdIssueDate: z.coerce
      .date("Ngày cấp không hợp lệ")
      .optional()
      .nullable(),
    avatarUrl: z.string().url("URL ảnh không hợp lệ").optional().nullable(),
  });

/**
 * Change Password Request Schema (BACKEND - API)
 * Dùng ở: Server Action changePasswordAction()
 */
export const ChangePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

/**
 * ============================================================================
 * RESPONSE SCHEMAS (Backend API)
 * ============================================================================
 */

/**
 * Profile Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer validate response trước khi trả về API
 * API responses: GET /api/v1/profile
 * Bao gồm tất cả fields: thông tin cá nhân + công việc (read-only) + nested clinic object
 */
export const ProfileResponseSchema = z.object({
  // Account info (read-only)
  id: z.string().uuid(),
  uid: z.string(),
  email: z.string().email().nullable(),
  role: z.string(),

  // Basic info (editable)
  fullName: z.string(),
  dob: z.string().datetime().nullable(),
  gender: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  favoriteColor: z.string().nullable(),

  // Contact info (editable)
  phone: z.string().nullable(),
  currentAddress: z.string().nullable(),
  hometown: z.string().nullable(),

  // Legal info (editable)
  nationalId: z.string().nullable(),
  nationalIdIssueDate: z.string().datetime().nullable(),
  nationalIdIssuePlace: z.string().nullable(),
  taxId: z.string().nullable(),
  insuranceNumber: z.string().nullable(),

  // Banking info (editable)
  bankAccountNumber: z.string().nullable(),
  bankName: z.string().nullable(),

  // Work info (read-only)
  employeeCode: z.string().nullable(),
  employeeStatus: z.string().nullable(),
  clinicId: z.string().nullable(),
  clinic: z
    .object({
      id: z.string(),
      clinicCode: z.string(),
      name: z.string(),
      colorCode: z.string().nullable(),
    })
    .nullable(),
  department: z.string().nullable(),
  team: z.string().nullable(),
  jobTitle: z.string().nullable(),
  positionTitle: z.string().nullable(),

  // Metadata (read-only)
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

/** Frontend Types */
export type UpdateProfileFormData = z.infer<typeof UpdateProfileFormSchema>;
export type BasicInfoFormData = z.infer<typeof BasicInfoFormSchema>;
export type ContactInfoFormData = z.infer<typeof ContactInfoFormSchema>;
export type LegalInfoFormData = z.infer<typeof LegalInfoFormSchema>;
export type BankingInfoFormData = z.infer<typeof BankingInfoFormSchema>;
export type ChangePasswordFormData = z.infer<typeof ChangePasswordFormSchema>;

/** Backend Types */
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
