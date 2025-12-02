// src/shared/validation/customer.schema.ts
import { z } from "zod";
import { VN_PHONE_RE, HEX6_RE } from "./clinic.schema";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Customer Common Fields Schema
 * Base schema chứa tất cả fields NGOẠI TRỪ `dob`
 * Dùng để tái sử dụng cho cả Frontend (form) và Backend (API)
 * - Frontend: Extend với dob: string
 * - Backend: Extend với dob: Date
 */
const CustomerCommonFieldsSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Họ và tên phải có ít nhất 2 ký tự")
    .max(200, "Họ và tên không được quá 200 ký tự"),
  gender: z.string().trim().min(1, "Vui lòng chọn giới tính"), // REQUIRED

  // Phone & Primary Contact validation rules
  phone: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine((val) => val === null || VN_PHONE_RE.test(val), {
      message: "Số điện thoại không hợp lệ",
    }),
  email: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine(
      (val) => val === null || z.string().email().safeParse(val).success,
      {
        message: "Email không hợp lệ",
      }
    ),

  // Address fields - REQUIRED
  address: z.string().trim().min(1, "Vui lòng nhập địa chỉ"),
  city: z.string().trim().min(1, "Vui lòng chọn tỉnh/thành phố"),
  district: z.string().trim().min(1, "Vui lòng chọn quận/huyện"),

  // Primary contact fields
  primaryContactRole: z.string().trim().optional().nullable(),
  primaryContactId: z.string().uuid().optional().nullable(),

  // Required fields
  clinicId: z.string().uuid("Phòng khám không hợp lệ"),
  serviceOfInterest: z.string().trim().min(1, "Vui lòng chọn dịch vụ quan tâm"), // REQUIRED
  source: z.string().trim().min(1, "Vui lòng chọn nguồn khách hàng"), // REQUIRED

  // Optional fields
  occupation: z.string().trim().optional().nullable(),
  sourceNotes: z.string().trim().optional().nullable(),
});

/**
 * Shared Conditional Validation Function
 * Validate conditional logic cho cả Frontend và Backend:
 * - Rule 1: Nếu không có phone → Bắt buộc có primaryContactId + primaryContactRole
 * - Rule 2: Nếu có city → Bắt buộc có district
 *
 * Tái sử dụng trong:
 * - CreateCustomerFormSchema (Frontend)
 * - CreateCustomerRequestSchema (Backend)
 */
const validateCustomerConditionalFields = (
  data: {
    phone?: string | null;
    primaryContactId?: string | null;
    primaryContactRole?: string | null;
    city?: string;
    district?: string;
  },
  ctx: z.RefinementCtx
) => {
  // Rule 1: If no phone, then primaryContactId + primaryContactRole are required
  if (!data.phone) {
    if (!data.primaryContactId) {
      ctx.addIssue({
        code: "custom",
        message: "Nhập số điện thoại hoặc chọn người liên hệ chính",
        path: ["primaryContactId"],
      });
    }
    if (!data.primaryContactRole) {
      ctx.addIssue({
        code: "custom",
        message: "Nhập vai trò người liên hệ",
        path: ["primaryContactRole"],
      });
    }
  }

  // Rule 2: district required when city is provided
  if (data.city && !data.district) {
    ctx.addIssue({
      code: "custom",
      message: "Vui lòng chọn quận/huyện khi đã chọn tỉnh/thành phố",
      path: ["district"],
    });
  }
};

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Customer Form Schema (FRONTEND ONLY)
 * Dùng ở: CreateCustomerModal component với React Hook Form + zodResolver
 *
 * Khác biệt với Backend schema:
 * - dob: string (form lưu "YYYY-MM-DD", convert sang Date khi submit)
 * - gender: string (empty initial allowed, validated on blur/submit)
 *
 * Flow: User input → Validate (string) → onSubmit → Convert to Date → API
 */
export const CreateCustomerFormSchema = CustomerCommonFieldsSchema.extend({
  dob: z.string().min(1, "Vui lòng chọn ngày sinh"), // STRING for DatePicker
}).superRefine(validateCustomerConditionalFields);

/**
 * ============================================================================
 * BACKEND SCHEMAS (Server-side API Validation)
 * ============================================================================
 */

/**
 * Customer Request Base Schema (BACKEND - for API)
 * Base schema cho Create/Update requests từ client → server
 * - dob: Date (z.coerce.date auto-converts from ISO string)
 */
export const CustomerRequestBaseSchema = CustomerCommonFieldsSchema.extend({
  dob: z.coerce.date("Ngày sinh không hợp lệ"), // DATE for backend
});

/**
 * Create Customer Request Schema (BACKEND - API)
 * Dùng ở: API POST /api/v1/customers (server-side)
 * Service layer validate request từ client trước khi ghi database
 *
 * Khác với FormSchema:
 * - dob: Date (đã convert từ ISO string)
 * - Validate conditional logic với shared function
 */
export const CreateCustomerRequestSchema =
  CustomerRequestBaseSchema.superRefine(validateCustomerConditionalFields);

/**
 * Update Customer Request Schema (BACKEND - API)
 * Dùng ở: API PATCH /api/v1/customers/[id] (server-side)
 * Partial update - all fields optional
 *
 * Note: customerCode cannot be updated (not in CustomerRequestBaseSchema)
 *
 * Admin-only fields:
 * - clinicId: Chỉ admin mới được chuyển customer sang clinic khác (validated in service layer)
 */
export const UpdateCustomerRequestSchema = CustomerRequestBaseSchema.partial() // Make all fields optional for partial updates
  .superRefine((data, ctx) => {
    // Only validate conditional logic if relevant fields are provided
    // Skip validation nếu không có phone/primaryContact fields trong update
    const hasPhoneField = "phone" in data;
    const hasPrimaryContactFields =
      "primaryContactId" in data || "primaryContactRole" in data;

    if (hasPhoneField || hasPrimaryContactFields) {
      validateCustomerConditionalFields(data, ctx);
    }
  });

/**
 * Customer Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer (customer.service.ts) validate response trước khi trả về API
 * API responses: GET /api/v1/customers, GET /api/v1/customers/[id], POST /api/v1/customers
 *
 * Cho phép nullable cho các field để backward compatible với dữ liệu cũ
 * Data cũ có thể có null cho: dob, gender, address, city, district, source, serviceOfInterest, clinicId
 */
export const CustomerResponseSchema = z.object({
  // Core fields - always required
  id: z.string().uuid(),
  fullName: z.string(),
  createdById: z.string().uuid(),
  updatedById: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),

  // Nullable fields - backward compatibility
  customerCode: z.string().nullable(),
  dob: z.string().datetime().nullable(), // NULLABLE - data cũ có thể null
  gender: z.string().nullable(), // NULLABLE - data cũ có thể null
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(), // NULLABLE - data cũ có thể null
  city: z.string().nullable(), // NULLABLE - data cũ có thể null
  district: z.string().nullable(), // NULLABLE - data cũ có thể null
  primaryContactRole: z.string().nullable(),
  primaryContactId: z.uuid().nullable(),
  occupation: z.string().nullable(),
  source: z.string().nullable(), // NULLABLE - data cũ có thể null
  sourceNotes: z.string().nullable(),
  serviceOfInterest: z.string().nullable(), // NULLABLE - data cũ có thể null
  clinicId: z.string().uuid().nullable(), // NULLABLE - data cũ có thể null

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
  primaryContact: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
      phone: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

/**
 * Customer Detail Response Schema (BACKEND - API Response)
 * Dùng ở: GET /api/v1/customers/[id] - Chi tiết customer với full relations
 * Extends CustomerResponseSchema với thêm sourceEmployee và sourceCustomer relations
 *
 * Chỉ thêm các fields KHÔNG CÓ trong CustomerResponseSchema:
 * - sourceEmployee: Relation khi source = 'employee_referral'
 * - sourceCustomer: Relation khi source = 'customer_referral'
 *
 * Các fields đã có trong CustomerResponseSchema (clinic, primaryContact, createdBy, updatedBy)
 * sẽ được kế thừa tự động, không cần khai báo lại
 */
export const CustomerDetailResponseSchema = CustomerResponseSchema.extend({
  // Source Employee relation (conditional - only when source = 'employee_referral')
  sourceEmployee: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
      phone: z.string().nullable(),
    })
    .nullable()
    .optional(),

  // Source Customer relation (conditional - only when source = 'customer_referral')
  sourceCustomer: z
    .object({
      id: z.string().uuid(),
      fullName: z.string(),
      phone: z.string().nullable(),
      customerCode: z.string().nullable(),
    })
    .nullable()
    .optional(),

  // Appointments relation (for Customer Detail view - check-in status + tab count)
  appointments: z
    .array(
      z.object({
        id: z.string().uuid(),
        appointmentDateTime: z.string().datetime(),
        checkInTime: z.string().datetime().nullable(),
        checkOutTime: z.string().datetime().nullable(),
        status: z.string(),
      })
    )
    .optional(),
});

/**
 * List Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer validate response của GET /api/v1/customers
 * Bao gồm: items (array customers), count, page, pageSize cho pagination
 */
export const CustomersListResponseSchema = z.object({
  items: z.array(CustomerResponseSchema),
  count: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

/**
 * ============================================================================
 * QUERY & RESPONSE SCHEMAS (Backend API)
 * ============================================================================
 */

/**
 * Get Customers Query Schema (BACKEND - API Query Params)
 * Dùng ở: Service layer validate query params của GET /api/v1/customers
 * Hỗ trợ: search, pagination (page, pageSize), filters (clinicId, source, serviceOfInterest), sorting
 */
export const GetCustomersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  clinicId: z.string().uuid().optional(),
  source: z.string().optional(),
  serviceOfInterest: z.string().optional(),
  sort: z.string().optional().default("createdAt:desc"),
});

/**
 * Daily Query Schema (BACKEND - API Query Params)
 * Dùng ở: Service layer validate query params của GET /api/v1/customers/daily
 * Lấy danh sách khách hàng theo ngày (default: hôm nay) và clinicId
 */
export const GetCustomersDailyQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ (yyyy-MM-dd)")
    .optional(),
  clinicId: z.string().uuid().optional(),
  includeAppointments: z.coerce.boolean().optional().default(false),
});

/**
 * Customer Daily Response Schema (BACKEND - API Response)
 * Extends CustomerResponseSchema với thêm todayAppointment cho quick check-in feature
 * Dùng ở: GET /api/v1/customers/daily?includeAppointments=true
 */
export const CustomerDailyResponseSchema = CustomerResponseSchema.extend({
  todayAppointment: z
    .object({
      id: z.string().uuid(),
      appointmentDateTime: z.coerce.date(),
      status: z.string(),
      checkInTime: z.coerce.date().nullable(),
      checkOutTime: z.coerce.date().nullable(),
      primaryDentist: z.object({
        id: z.string().uuid(),
        fullName: z.string(),
      }),
    })
    .nullable()
    .optional(),
});

/**
 * Search Query Schema (BACKEND - API Query Params)
 * Dùng ở: API GET /api/v1/customers/search?q=keyword
 * Tìm kiếm khách hàng global theo customerCode/fullName/phone
 * Support các contexts:
 * - Phone Lookup: chỉ cần q=phone
 * - Primary Contact: requirePhone=true
 * - Customer Source: requirePhone=false
 * - Global Header Search: tìm tất cả fields
 */
export const SearchQuerySchema = z.object({
  q: z.string().min(1, "Từ khóa tìm kiếm không được trống"),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  requirePhone: z
    .enum(["true", "false"])
    .default("false")
    .transform((val) => val === "true"),
});

/**
 * Search Item Schema (BACKEND - API Response Item)
 * Dùng ở: Response item structure cho search results
 * Chứa thông tin: id, customerCode, fullName, phone (nullable)
 */
export const SearchItemSchema = z.object({
  id: z.string().uuid(),
  customerCode: z.string().nullable(),
  fullName: z.string(),
  phone: z.string().nullable(),
});

/**
 * Search Response Schema (BACKEND - API Response)
 * Dùng ở: Service layer validate response của GET /api/v1/customers/search
 * Bao gồm array of SearchItemSchema (limit default 10)
 */
export const SearchResponseSchema = z.object({
  items: z.array(SearchItemSchema),
});

/**
 * ============================================================================
 * TYPE EXPORTS
 * ============================================================================
 */

/** Frontend Types */
export type CreateCustomerFormData = z.infer<typeof CreateCustomerFormSchema>;

/** Backend Types */
export type CreateCustomerRequest = z.infer<typeof CreateCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof UpdateCustomerRequestSchema>;
export type CustomerResponse = z.infer<typeof CustomerResponseSchema>;
export type CustomerDetailResponse = z.infer<
  typeof CustomerDetailResponseSchema
>;
export type CustomerDailyResponse = z.infer<typeof CustomerDailyResponseSchema>;
export type GetCustomersQuery = z.infer<typeof GetCustomersQuerySchema>;
export type GetCustomersDailyQuery = z.infer<
  typeof GetCustomersDailyQuerySchema
>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchItem = z.infer<typeof SearchItemSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
