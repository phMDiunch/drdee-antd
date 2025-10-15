// src/shared/validation/employee.schema.ts
import { z } from "zod";
import { VN_PHONE_RE, HEX6_RE } from "./clinic.schema";

export const EMPLOYEE_ROLES = ["admin", "employee"] as const;
export const EMPLOYEE_STATUSES = ["PENDING", "WORKING", "RESIGNED"] as const;
const VN_NATIONAL_ID_RE = /^(?:\d{9}|\d{12})$/;

export const EmployeeBaseSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  email: z.string().trim().email("Email không hợp lệ").optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_RE, "Số điện thoại không hợp lệ")
    .optional()
    .nullable(),
  // Không dùng required_error, giữ kiểu cũ
  role: z.enum(EMPLOYEE_ROLES),
  clinicId: z.string().uuid("Phòng khám không hợp lệ"),
  employeeCode: z.string().trim().optional().nullable(),
  employeeStatus: z.enum(EMPLOYEE_STATUSES).default("PENDING").optional(),
  department: z.string().trim().min(1, "Vui lòng nhập phòng ban"),
  jobTitle: z.string().trim().min(1, "Vui lòng nhập chức danh"),
  team: z.string().trim().optional().nullable(),
  positionTitle: z.string().trim().optional().nullable(),
});

export const CreateEmployeeRequestSchema = EmployeeBaseSchema;

// Keep a minimal schema for backward compatibility
// Admin có thể sửa thêm các trường hồ sơ cá nhân
export const UpdateEmployeeRequestSchema = EmployeeBaseSchema.extend({
  id: z.string().uuid("ID nhân viên không hợp lệ"),
  dob: z.coerce.date("Ngày sinh không hợp lệ").optional().nullable(),
  gender: z.string().trim().optional().nullable(),
  favoriteColor: z
    .string()
    .regex(HEX6_RE, "Màu yêu thích phải là mã hex")
    .optional()
    .nullable(),
  currentAddress: z.string().trim().optional().nullable(),
  hometown: z.string().trim().optional().nullable(),
  nationalId: z
    .string()
    .trim()
    .regex(VN_NATIONAL_ID_RE, "CMND/CCCD phải gồm 9 hoặc 12 chữ số")
    .optional()
    .nullable(),
  nationalIdIssueDate: z.coerce
    .date("Ngày cấp CMND/CCCD không hợp lệ")
    .optional()
    .nullable(),
  nationalIdIssuePlace: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  insuranceNumber: z.string().trim().optional().nullable(),
  bankAccountNumber: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
});

// Extended admin edit schema: allow updating additional profile fields
// (ĐÃ GỘP) Không cần schema riêng cho admin nữa

export const CompleteProfileRequestSchema = z
  .object({
    id: z.string().uuid(),
    fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
    dob: z.coerce.date("Ngày sinh không hợp lệ"),
    gender: z.string("Vui lòng chọn giới tính"),
    favoriteColor: z.string().regex(HEX6_RE, "Màu yêu thích phải là mã hex"),
    currentAddress: z.string().trim().min(1, "Vui lòng nhập địa chỉ hiện tại"),
    hometown: z.string().trim().min(1, "Vui lòng nhập quê quán"),
    nationalId: z
      .string()
      .trim()
      .regex(VN_NATIONAL_ID_RE, "CMND/CCCD phải gồm 9 hoặc 12 chữ số"),
    nationalIdIssueDate: z.coerce.date("Ngày cấp CMND/CCCD không hợp lệ"),
    nationalIdIssuePlace: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập nơi cấp CMND/CCCD"),
    taxId: z.string().trim().optional().nullable(),
    insuranceNumber: z.string().trim().optional().nullable(),
    bankAccountNumber: z.string().trim().optional().nullable(),
    bankName: z.string().trim().optional().nullable(),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const SetEmployeeStatusRequestSchema = z.object({
  // Admin can only set WORKING or RESIGNED
  status: z.enum(["WORKING", "RESIGNED"] as const),
});

export const EmployeeResponseSchema = EmployeeBaseSchema.extend({
  id: z.string().uuid(),
  uid: z.string().nullable().optional(),
  dob: z.string().datetime().nullable().optional(),
  gender: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  favoriteColor: z.string().nullable().optional(),
  currentAddress: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  hometown: z.string().nullable().optional(),
  nationalId: z.string().nullable().optional(),
  nationalIdIssueDate: z.string().datetime().nullable().optional(),
  nationalIdIssuePlace: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  bankAccountNumber: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  createdById: z.string().uuid().nullable().optional(),
  updatedById: z.string().uuid().nullable().optional(),
  // Bổ sung metadata thân thiện
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  clinicCode: z.string().nullable().optional(),
  clinicName: z.string().nullable().optional(),
  colorCode: z.string().regex(HEX6_RE).nullable().optional(),
});

export const EmployeesResponseSchema = z.array(EmployeeResponseSchema);

export const WorkingEmployeeResponseSchema = z.array(
  z.object({
    id: z.string(),
    fullName: z.string(),
    employeeCode: z.string().nullable(),
    jobTitle: z.string().nullable(),
    role: z.enum(EMPLOYEE_ROLES),
    department: z.string(),
    clinicId: z.string(),
  })
);

export const GetEmployeesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});

export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.infer<typeof UpdateEmployeeRequestSchema>;
export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>;
export type WorkingEmployeeResponse = z.infer<
  typeof WorkingEmployeeResponseSchema
>;
export type CompleteProfileRequest = z.infer<
  typeof CompleteProfileRequestSchema
>;
