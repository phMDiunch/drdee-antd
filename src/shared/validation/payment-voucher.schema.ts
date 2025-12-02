// src/shared/validation/payment-voucher.schema.ts
import { z } from "zod";

/**
 * ============================================================================
 * SHARED BASE SCHEMAS (Common Fields)
 * ============================================================================
 */

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = [
  "Tiền mặt",
  "Quẹt thẻ thường",
  "Quẹt thẻ Visa",
  "Chuyển khoản",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Payment Voucher Detail Schema
 * Dùng ở: PaymentVoucherCommonFieldsSchema, PaymentVoucherDetailResponseSchema
 * Used in both Create and Update requests
 */
const PaymentVoucherDetailSchema = z.object({
  consultedServiceId: z
    .string({ message: "Vui lòng chọn dịch vụ" })
    .uuid("ID dịch vụ không hợp lệ"),
  amount: z
    .number({ message: "Số tiền phải là số" })
    .int("Số tiền phải là số nguyên")
    .min(1, "Số tiền tối thiểu là 1"),
  paymentMethod: z.enum(PAYMENT_METHODS, {
    message: "Phương thức thanh toán không hợp lệ",
  }),
});

/**
 * Payment Voucher Common Fields Schema
 * Dùng ở: CreatePaymentVoucherFormSchema, UpdatePaymentVoucherFormSchema, CreatePaymentVoucherRequestSchema
 * Base schema chứa tất cả fields shared giữa Frontend và Backend
 */
const PaymentVoucherCommonFieldsSchema = z.object({
  customerId: z
    .string({ message: "Vui lòng chọn khách hàng" })
    .uuid("ID khách hàng không hợp lệ"),
  details: z
    .array(PaymentVoucherDetailSchema)
    .min(1, "Vui lòng chọn ít nhất một dịch vụ để thu tiền"),
  notes: z.string().trim().optional().nullable(),
});

/**
 * ============================================================================
 * FRONTEND SCHEMAS (Client-side Form Validation)
 * ============================================================================
 */

/**
 * Create Payment Voucher Form Schema (FRONTEND ONLY)
 * Dùng ở: PaymentVoucherModal component với React Hook Form + zodResolver
 */
export const CreatePaymentVoucherFormSchema = PaymentVoucherCommonFieldsSchema;

export type CreatePaymentVoucherFormData = z.infer<
  typeof CreatePaymentVoucherFormSchema
>;

/**
 * Update Payment Voucher Form Schema (FRONTEND ONLY)
 * Dùng ở: PaymentVoucherModal component (edit mode) với React Hook Form + zodResolver
 */
export const UpdatePaymentVoucherFormSchema = PaymentVoucherCommonFieldsSchema;

export type UpdatePaymentVoucherFormData = z.infer<
  typeof UpdatePaymentVoucherFormSchema
>;

/**
 * ============================================================================
 * BACKEND SCHEMAS (API Request/Response Validation)
 * ============================================================================
 */

/**
 * Create Payment Voucher Request Schema (BACKEND)
 * Dùng ở: Server Action createPaymentVoucherAction
 */
export const CreatePaymentVoucherRequestSchema =
  PaymentVoucherCommonFieldsSchema;

export type CreatePaymentVoucherRequest = z.infer<
  typeof CreatePaymentVoucherRequestSchema
>;

/**
 * Update Payment Voucher Request Schema (BACKEND)
 * Dùng ở: Server Action updatePaymentVoucherAction
 */
export const UpdatePaymentVoucherRequestSchema =
  PaymentVoucherCommonFieldsSchema.partial().extend({
    notes: z.string().trim().optional().nullable(),
    details: z.array(PaymentVoucherDetailSchema).optional(),
    // Admin can update these fields
    cashierId: z.string().uuid().optional(),
    paymentDate: z.string().datetime().optional(), // ISO string from DatePicker
  });

export type UpdatePaymentVoucherRequest = z.infer<
  typeof UpdatePaymentVoucherRequestSchema
>;

/**
 * Payment Voucher Detail Response Schema
 * Dùng ở: Service layer để validate API response data
 */
const PaymentVoucherDetailResponseSchema = z.object({
  id: z.string(),
  consultedServiceId: z.string(),
  consultedServiceName: z.string(),
  consultedServiceFinalPrice: z.number(),
  amount: z.number(),
  paymentMethod: z.string(),
  createdAt: z.string().datetime(),
});

export type PaymentVoucherDetailResponse = z.infer<
  typeof PaymentVoucherDetailResponseSchema
>;

/**
 * Payment Voucher Response Schema
 * Dùng ở: Service layer (payment-voucher.service.ts) để validate API response
 * Dùng ở: Frontend components cho type safety với nested structure
 * API responses: GET /api/v1/payment-vouchers/[id], POST /api/v1/payment-vouchers
 */
export const PaymentVoucherResponseSchema = z.object({
  id: z.string(),
  paymentNumber: z.string(),
  customer: z.object({
    id: z.string(),
    fullName: z.string(),
    code: z.string(),
  }),
  paymentDate: z.string(),
  totalAmount: z.number(),
  notes: z.string().nullable(),
  cashier: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  clinic: z.object({
    id: z.string(),
    name: z.string(),
  }),
  customerClinicId: z.string().nullable().optional(), // Customer's current clinic for permission checks
  details: z.array(PaymentVoucherDetailResponseSchema),
  createdBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  updatedBy: z.object({
    id: z.string(),
    fullName: z.string(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PaymentVoucherResponse = z.infer<
  typeof PaymentVoucherResponseSchema
>;

/**
 * Payment Vouchers List Response Schema
 * Dùng ở: API route /api/v1/payment-vouchers để validate paginated list response
 */
export const PaymentVouchersListResponseSchema = z.object({
  items: z.array(PaymentVoucherResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type PaymentVouchersListResponse = z.infer<
  typeof PaymentVouchersListResponseSchema
>;

/**
 * Get Payment Vouchers Query Schema
 * Dùng ở: API route /api/v1/payment-vouchers để validate query parameters
 */
export const GetPaymentVouchersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  customerId: z.string().uuid().optional(),
  clinicId: z.string().uuid().optional(),
  sortField: z.string().default("paymentDate"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
});

export type GetPaymentVouchersQuery = z.infer<
  typeof GetPaymentVouchersQuerySchema
>;

/**
 * Get Payment Vouchers Daily Query Schema
 * Dùng ở: API route /api/v1/payment-vouchers/daily để validate query parameters
 */
export const GetPaymentVouchersDailyQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ"),
  clinicId: z.string().uuid().optional(),
});

export type GetPaymentVouchersDailyQuery = z.infer<
  typeof GetPaymentVouchersDailyQuerySchema
>;

/**
 * Payment Method Statistics
 * Dùng ở: PaymentVouchersDailyStatisticsSchema để thống kê theo phương thức thanh toán
 */
const PaymentMethodStatSchema = z.object({
  amount: z.number(),
  count: z.number(),
});

/**
 * Payment Vouchers Daily Statistics
 * Dùng ở: PaymentVouchersDailyResponseSchema để thống kê doanh thu theo ngày
 */
const PaymentVouchersDailyStatisticsSchema = z.object({
  totalAmount: z.number(),
  totalCount: z.number(),
  byMethod: z.record(z.string(), PaymentMethodStatSchema),
});

export type PaymentVouchersDailyStatistics = z.infer<
  typeof PaymentVouchersDailyStatisticsSchema
>;

/**
 * Payment Vouchers Daily Response Schema
 * Dùng ở: API route /api/v1/payment-vouchers/daily để validate response data
 */
export const PaymentVouchersDailyResponseSchema = z.object({
  items: z.array(PaymentVoucherResponseSchema),
  count: z.number(),
  statistics: PaymentVouchersDailyStatisticsSchema,
});

export type PaymentVouchersDailyResponse = z.infer<
  typeof PaymentVouchersDailyResponseSchema
>;

/**
 * Unpaid Service Schema (Dịch vụ chưa thanh toán hết)
 * Dùng ở: PaymentVoucherModal để hiển thị các dịch vụ còn dư nợ
 *
 * Unpaid Service = Dịch vụ đã chốt nhưng chưa thanh toán đủ số tiền
 * Ví dụ: Dịch vụ 5tr, đã trả 2tr, còn nợ 3tr → Unpaid
 */
export const UnpaidServiceSchema = z.object({
  id: z.string(),
  consultedServiceName: z.string(),
  finalPrice: z.number(), // Tổng tiền dịch vụ
  amountPaid: z.number(), // Đã thanh toán
  debt: z.number(), // Còn nợ (finalPrice - amountPaid)
  serviceStatus: z.string(),
});

export type UnpaidService = z.infer<typeof UnpaidServiceSchema>;

/**
 * Unpaid Services Response Schema (Danh sách dịch vụ chưa thanh toán hết)
 * Dùng ở: API route /api/v1/customers/[id]/unpaid-services response validation
 */
export const UnpaidServicesResponseSchema = z.object({
  items: z.array(UnpaidServiceSchema),
  totalDebt: z.number(), // Tổng số tiền nợ của khách hàng
});

export type UnpaidServicesResponse = z.infer<
  typeof UnpaidServicesResponseSchema
>;
