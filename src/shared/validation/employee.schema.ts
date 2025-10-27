// src/shared/validation/employee.schema.ts
import { z } from "zod";
import { VN_PHONE_RE, HEX6_RE } from "./clinic.schema";

export const EMPLOYEE_ROLES = ["admin", "employee"] as const;
export const EMPLOYEE_STATUSES = ["PENDING", "WORKING", "RESIGNED"] as const;
const VN_NATIONAL_ID_RE = /^(?:\d{9}|\d{12})$/;

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Employee Common Fields Schema
 * Base schema chứa tất cả fields cơ bản NGOẠI TRỪ các extended profile fields (dob, gender...)
 * Dùng để tái sử dụng cho cả Frontend (form) và Backend (API)
 * - Frontend: Có thể extend với Date object cho DatePicker
 * - Backend: Có thể extend với z.coerce.date() cho API
 */
const EmployeeCommonFieldsSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên"),
  email: z.string().trim().email("Email không hợp lệ").optional().nullable(),
  phone: z
    .string()
    .trim()
    .regex(VN_PHONE_RE, "Số điện thoại không hợp lệ")
    .optional()
    .nullable(),
  role: z.enum(EMPLOYEE_ROLES),
  clinicId: z.string().uuid("Phòng khám không hợp lệ"),
  employeeCode: z.string().trim().optional().nullable(),
  employeeStatus: z.enum(EMPLOYEE_STATUSES).default("PENDING").optional(),
  department: z.string().trim().min(1, "Vui lòng nhập phòng ban"),
  jobTitle: z.string().trim().min(1, "Vui lòng nhập chức danh"),
  team: z.string().trim().optional().nullable(),
  positionTitle: z.string().trim().optional().nullable(),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Employee Form Schema (FRONTEND ONLY)
 * Dùng ở: CreateEmployeeModal component với React Hook Form + zodResolver
 * Tạo nhân viên mới chỉ cần thông tin cơ bản, không cần dob/gender/extended profile
 */
export const CreateEmployeeFormSchema = EmployeeCommonFieldsSchema;

/**
 * Update Employee Form Schema (FRONTEND ONLY)
 * Dùng ở: EmployeeEditView component với React Hook Form + zodResolver
 *
 * Khác biệt với Backend schema:
 * - dob: Date object (DatePicker onChange returns Date, not string)
 * - nationalIdIssueDate: Date object (DatePicker)
 *
 * Flow: User input → Validate (Date object) → onSubmit → Convert to ISO string → API
 */
export const UpdateEmployeeFormSchema = EmployeeCommonFieldsSchema.extend({
  id: z.string().uuid("ID nhân viên không hợp lệ"),
  dob: z.date().optional().nullable(),
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
  nationalIdIssueDate: z.date().optional().nullable(),
  nationalIdIssuePlace: z.string().trim().optional().nullable(),
  taxId: z.string().trim().optional().nullable(),
  insuranceNumber: z.string().trim().optional().nullable(),
  bankAccountNumber: z.string().trim().optional().nullable(),
  bankName: z.string().trim().optional().nullable(),
});

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Create Employee Request Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/employees (server-side)
 * Service layer validate request từ client trước khi ghi database
 * Tạo nhân viên mới với status PENDING, gửi email mời hoàn thiện hồ sơ
 */
export const CreateEmployeeRequestSchema = EmployeeCommonFieldsSchema;

/**
 * Update Employee Request Schema (BACKEND - API)
 * Dùng ở: API PUT/PATCH /api/v1/employees/[id] (server-side)
 * Admin có thể sửa cả thông tin cơ bản + hồ sơ cá nhân (dob, gender, nationalId...)
 *
 * Khác với FormSchema:
 * - dob: z.coerce.date() (auto-convert từ ISO string/Date object)
 * - nationalIdIssueDate: z.coerce.date()
 */
export const UpdateEmployeeRequestSchema = EmployeeCommonFieldsSchema.extend({
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

/**
 * Complete Profile Request Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/employees/[id]/complete-profile (server-side)
 * Nhân viên PENDING phải điền đầy đủ: dob, gender, nationalId, address... + set password
 * Sau khi hoàn thành → status chuyển WORKING
 */
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

/**
 * Set Employee Status Request Schema (BACKEND - API)
 * Dùng ở: API PATCH /api/v1/employees/[id]/status (server-side)
 * Admin có thể set status WORKING hoặc RESIGNED (không thể set PENDING)
 */
export const SetEmployeeStatusRequestSchema = z.object({
  status: z.enum(["WORKING", "RESIGNED"] as const),
});

/**
 * ============================================================================
 * RESPONSE SCHEMAS (Backend API)
 * ============================================================================
 */

/**
 * Employee Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer validate response trước khi trả về API
 * API responses: GET /api/v1/employees, GET /api/v1/employees/[id], POST /api/v1/employees
 * Bao gồm tất cả fields: thông tin cơ bản + hồ sơ cá nhân + nested objects (clinic, createdBy, updatedBy)
 */
export const EmployeeResponseSchema = EmployeeCommonFieldsSchema.extend({
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
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Nested objects - bao gồm cả id để dễ dàng reference
  clinic: z
    .object({
      id: z.string().uuid(),
      clinicCode: z.string(),
      name: z.string(),
      colorCode: z.string().regex(HEX6_RE),
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
 * Employees Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer validate response của GET /api/v1/employees (array of employees)
 */
export const EmployeesResponseSchema = z.array(EmployeeResponseSchema);

/**
 * Working Employee Response Schema (BACKEND - API Response)
 * Dùng ở: API GET /api/v1/employees/working (chỉ lấy nhân viên đang làm việc)
 * Trả về thông tin tối giản: id, fullName, employeeCode, jobTitle, role, department, clinicId
 * Dùng cho dropdown/search nhân viên trong các form (ví dụ: source=employee_search)
 */
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

/**
 * ============================================================================
 * QUERY SCHEMAS (Backend API)
 * ============================================================================
 */

/**
 * Get Employees Query Schema (BACKEND - API Query Params)
 * Dùng ở: Service layer validate query params của GET /api/v1/employees
 * Hỗ trợ: search (fullName, employeeCode, email, phone), filter theo status
 */
export const GetEmployeesQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

/** Frontend Types */
export type CreateEmployeeFormData = z.infer<typeof CreateEmployeeFormSchema>;
export type UpdateEmployeeFormData = z.infer<typeof UpdateEmployeeFormSchema>;

/** Backend Types */
export type CreateEmployeeRequest = z.infer<typeof CreateEmployeeRequestSchema>;
export type UpdateEmployeeRequest = z.infer<typeof UpdateEmployeeRequestSchema>;
export type EmployeeResponse = z.infer<typeof EmployeeResponseSchema>;
export type WorkingEmployeeResponse = z.infer<
  typeof WorkingEmployeeResponseSchema
>;
export type CompleteProfileRequest = z.infer<
  typeof CompleteProfileRequestSchema
>;
